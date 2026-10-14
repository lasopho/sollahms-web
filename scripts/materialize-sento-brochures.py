#!/usr/bin/env python3
"""Rebuild Sento brochure photos and readable plan cards from verified PDFs.

Photographs are extracted from their original embedded PDF image objects.
Plans retain page orientation, labels and surfaces through lossless crops of a
Poppler render. Normalized crop boxes use top-left coordinates. No image is
enlarged beyond its native pixel dimensions. Commercial information is not
inferred from these documents.
"""
import argparse
import copy
import hashlib
import io
import json
import shutil
import subprocess
import tempfile
import unicodedata
from pathlib import Path

from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SLUGS = {"curico-77", "domeyko-2055", "jofre-135", "mirador-la-florida", "plaza-las-condes", "san-ignacio"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def crop_box(crop, width, height):
    require(isinstance(crop, list) and len(crop) == 4 and
            0 <= crop[0] < crop[2] <= 1 and 0 <= crop[1] < crop[3] <= 1,
            "Invalid normalized crop")
    return tuple(round(value * (width if index % 2 == 0 else height))
                 for index, value in enumerate(crop))


def rgb(image):
    if image.mode in ("RGBA", "LA") or "transparency" in image.info:
        rgba = image.convert("RGBA")
        background = Image.new("RGBA", rgba.size, "white")
        return Image.alpha_composite(background, rgba).convert("RGB")
    return image.convert("RGB")


def save_image(image, path, lossless=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", lossless=lossless, quality=94, method=6)
    return {"sha256": digest(path.read_bytes()), "width": image.width,
            "height": image.height, "bytes": path.stat().st_size}


def output_path(root, local_path, slug, brochure=False):
    prefix = f"/assets/{'brochures' if brochure else 'propiedades'}/sento/"
    if not brochure:
        prefix += slug + "/"
    require(local_path.startswith(prefix), "Output escapes Sento asset scope")
    path = root / local_path.lstrip("/")
    require(path.resolve().is_relative_to(root.resolve()) and not path.is_symlink(),
            "Unsafe output path")
    return path


def source_file(input_dir, filename):
    require(Path(filename).name == filename and filename.endswith(".pdf"),
            "Expected a PDF basename")
    normalized = unicodedata.normalize("NFC", filename)
    candidates = [p for p in input_dir.rglob("*.pdf")
                  if unicodedata.normalize("NFC", p.name) == normalized]
    require(len(candidates) == 1, f"Expected one source for {filename}, found {len(candidates)}")
    require(not candidates[0].is_symlink(), "Source PDF must not be a symlink")
    return candidates[0]


def materialize(manifest_path, input_dir, root, pdftoppm, verify_only=False):
    manifest = json.loads(manifest_path.read_text())
    require(manifest.get("schemaVersion") == 1 and
            {row["slug"] for row in manifest["projects"]} == SLUGS and
            len(manifest["projects"]) == 6, "Expected the six distinct Sento brochure projects")
    result = copy.deepcopy(manifest)
    with tempfile.TemporaryDirectory(prefix="sollahms-sento-plans-") as temporary:
        cache = {}
        for row in result["projects"]:
            slug, document = row["slug"], row["document"]
            source = source_file(input_dir, document["fileName"])
            pdf = source.read_bytes()
            require(digest(pdf) == document["sha256"], f"Source PDF SHA256 mismatch: {slug}")
            reader = PdfReader(source)
            require(len(reader.pages) == document["pageCount"], f"Page count mismatch: {slug}")
            destination = output_path(root, document["localPath"], slug, brochure=True)
            if not verify_only:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(pdf)
            require(destination.is_file() and digest(destination.read_bytes()) == document["sha256"],
                    f"Published brochure differs from source: {slug}")
            document.pop("originalPath", None)
            document.update(sourceSha256=document["sha256"], sourcePage=1, bytes=len(pdf))
            native_cache = {}
            for index, asset in enumerate(row["images"]):
                local = f"/assets/propiedades/sento/{slug}/imagen-{index + 1:02d}.webp"
                destination = output_path(root, local, slug)
                if verify_only:
                    validate_derivative(destination, asset)
                    for variant in asset.get("variants", []):
                        validate_derivative(output_path(root, variant["localPath"], slug), variant)
                    continue
                page = asset["sourcePage"]
                if page not in native_cache:
                    native_cache[page] = list(reader.pages[page - 1].images)
                native = native_cache[page][asset["imageIndex"]]
                require(digest(native.data) == asset["originalSha256"], "Embedded image SHA256 mismatch")
                image = Image.open(io.BytesIO(native.data))
                require(image.size == (asset["nativeWidth"], asset["nativeHeight"]),
                        "Embedded image dimensions mismatch")
                image = rgb(image).crop(crop_box(asset.get("crop", [0, 0, 1, 1]), *image.size))
                image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
                metadata = save_image(image, destination)
                if asset.get("sha256"):
                    require(asset["sha256"] == metadata["sha256"], "Photo encoding differs from review")
                asset.update(metadata, localPath=local, sourceSha256=document["sha256"],
                             extractionMethod="pdf_image_object", visuallyVerified=True,
                             compression={"format": "webp", "quality": 94, "upscaled": False})
                asset["variants"] = []
                for width in [640, 960, 1440]:
                    if width >= image.width:
                        continue
                    resized = image.resize((width, round(width * image.height / image.width)),
                                           Image.Resampling.LANCZOS)
                    variant_local = local.replace(".webp", f"-{width}.webp")
                    variant = save_image(resized, output_path(root, variant_local, slug))
                    variant.update(localPath=variant_local)
                    asset["variants"].append(variant)
                asset["srcset"] = ", ".join(f'{variant["localPath"]} {variant["width"]}w'
                                            for variant in asset["variants"] + [asset])
                asset.pop("candidate", None)
            row["cover"] = row["images"][0]["localPath"]
            for index, model in enumerate(row["models"]):
                page, crop = model["sourcePage"], model["planCrop"]
                local = f"/assets/propiedades/sento/{slug}/plano-{index + 1:02d}.webp"
                destination = output_path(root, local, slug)
                if verify_only:
                    validate_derivative(destination, model["plan"])
                    for variant in model["plan"].get("variants", []):
                        validate_derivative(output_path(root, variant["localPath"], slug), variant)
                    continue
                if model.get("officialPlanOriginal"):
                    original = model["officialPlanOriginal"]
                    original_path = root / original["internalPath"]
                    require(original_path.resolve().is_relative_to(root.resolve()), "Official source escapes root")
                    data = original_path.read_bytes()
                    require(digest(data) == original["sha256"], "Official original SHA256 mismatch")
                    image = rgb(Image.open(io.BytesIO(data)))
                    require(image.size == (original["width"], original["height"]), "Official dimensions mismatch")
                    origin = {"extractionMethod": "official_original_image", "original": original,
                              "sourceUrl": original["sourceUrl"], "sourceSha256": original["sha256"],
                              "sourcePage": None, "sourceCode": model["label"], "sourceProjectSlug": slug,
                              "brochureEvidence": {"sourcePage": page, "sourceSha256": document["sha256"]},
                              "upscaled": False, "geometryEdited": False}
                elif "planImageIndex" in model:
                    image, origin = extract_native_plan(reader, model, native_cache)
                else:
                    key = (slug, page)
                    if key not in cache:
                        prefix = Path(temporary) / f"{slug}-{page:02d}"
                        subprocess.run([pdftoppm, "-f", str(page), "-l", str(page), "-singlefile",
                                        "-scale-to", "4200", "-png", str(source), str(prefix)],
                                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                        cache[key] = prefix.with_suffix(".png")
                    rendered = Image.open(cache[key]).convert("RGB")
                    image = rendered.crop(crop_box(crop, *rendered.size))
                    origin = {"extractionMethod": "pdf_page_crop", "renderMaxSide": 4200, "crop": crop}
                metadata = save_image(image, destination, lossless=True)
                if model.get("plan", {}).get("sha256"):
                    require(model["plan"]["sha256"] == metadata["sha256"], "Plan encoding differs from review")
                model["plan"] = {**metadata, "localPath": local, "sourcePage": page,
                                 "sourceSha256": document["sha256"], "kind": "plan",
                                 **origin, "visuallyVerified": True, "privacySafe": True,
                                 "assetScope": "named_development", "compression": "lossless_webp"}
            print(json.dumps({"project": slug, "images": len(row["images"]),
                              "plans": len(row["models"]), "verified": verify_only}), flush=True)
    if not verify_only:
        add_plan_variants(result, root)
        manifest_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    return {"projects": len(result["projects"]),
            "images": sum(len(row["images"]) for row in result["projects"]),
            "plans": sum(len(row["models"]) for row in result["projects"]), "verified": verify_only}


def extract_native_plan(reader, model, native_cache):
    """Extract Curicó's original diagrams without clipping walls under editorial headings."""
    page = model["sourcePage"]
    if page not in native_cache:
        native_cache[page] = list(reader.pages[page - 1].images)
    native = native_cache[page][model["planImageIndex"]]
    require(digest(native.data) == model["planOriginalSha256"], "Native plan SHA256 mismatch")
    original = Image.open(io.BytesIO(native.data))
    require(original.size == (model["planNativeWidth"], model["planNativeHeight"]),
            "Native plan dimensions mismatch")
    bounds = original.getchannel("A").getbbox() if original.mode == "RGBA" else (0, 0, *original.size)
    image = rgb(original.crop(bounds))
    origin = {"extractionMethod": "pdf_image_object", "imageIndex": model["planImageIndex"],
              "originalSha256": model["planOriginalSha256"], "nativeWidth": original.width,
              "nativeHeight": original.height, "alphaBounds": list(bounds), "upscaled": False,
              "labelsInProjectData": True}
    return image, origin


def add_plan_variants(manifest, root):
    """Keep full readable plans for zoom and smaller derivatives for cards."""
    for row in manifest["projects"]:
        for model in row["models"]:
            asset = model["plan"]
            image = Image.open(output_path(root, asset["localPath"], row["slug"])).convert("RGB")
            asset["variants"] = []
            for width in [640, 960]:
                if width >= image.width:
                    continue
                resized = image.resize((width, round(width * image.height / image.width)),
                                       Image.Resampling.LANCZOS)
                local = asset["localPath"].replace(".webp", f"-{width}.webp")
                variant = save_image(resized, output_path(root, local, row["slug"]), lossless=True)
                variant.update(localPath=local)
                asset["variants"].append(variant)
            asset["srcset"] = ", ".join(f'{variant["localPath"]} {variant["width"]}w'
                                        for variant in asset["variants"] + [asset])


def validate_derivative(path, metadata):
    require(path.is_file() and digest(path.read_bytes()) == metadata["sha256"],
            f"Derivative SHA256 mismatch: {path}")
    with Image.open(path) as image:
        require(image.size == (metadata["width"], metadata["height"]), "Derivative dimensions mismatch")
        image.verify()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, default=ROOT / "data/brochures-sento.json")
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--pdftoppm", default=shutil.which("pdftoppm"))
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    require(args.pdftoppm or args.verify_only, "Poppler pdftoppm is required")
    print(json.dumps(materialize(args.manifest, args.input, args.root,
                                 args.pdftoppm, args.verify_only)))


if __name__ == "__main__":
    main()
