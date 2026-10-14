#!/usr/bin/env python3
"""Prepare a private reproducible Ecasa candidate from committed source.

The92 approved Ecasa resources are Git inputs. The existing217 private inputs
retain exact source hashes. Builds and audits run offline; no deployment,
merge, alias, environment download or platform settings change is performed.
"""
import argparse
import io
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]
BRANCH = 'codex/ecasa-publicacion-independiente'
BASELINE = 'f1e9bf1715cc99d095a367eba9028a9a1ad2b026'
REVIEW = 'fb11f3fb466f7362cb20e99fa89b2abc610683c5'
CANDIDATE_FILES = {'data/ecasa-publication-candidate.json', 'scripts/ecasa-publication-candidate.mjs'}
PROFILE = 'ecasa_independent_candidate'
PRIVATE_FOLDERS = {'ingevec-preview', 'ecasa-preview', 'ecasa-official-review', 'ecasa-owner-review'}
VERIFICATION_TOOLS = ('tests/qa-ecasa.mjs', 'tests/qa-ecasa-remote.mjs', 'tests/qa-preview-server.mjs')

def require(value, message):
    if not value:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    return json.loads(path.read_text())


def load_script(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# Reuse strict original inventories/archive code, never legacy CLI entrypoints
# or a protected review reference to authorize a public release.
release = load_script('ecasa_independent_source_inventory', 'scripts/prepare-release.py')
bundle = load_script('ecasa_independent_archive_primitives', 'scripts/create-brochure-bundle.py')


def git(*args):
    return subprocess.run(['git', '-C', str(ROOT), *args], check=True, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, timeout=60).stdout


def tree_for(commit):
    tree = {}
    for record in git('ls-tree', '-rz', commit).split(b'\0'):
        if not record:
            continue
        fields, name = record.split(b'\t', 1)
        mode, kind, oid = fields.decode().split()
        tree[name.decode()] = {'mode': mode, 'kind': kind, 'oid': oid}
    return tree


def blob_id(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def regular(path):
    require(path.is_file() and not path.is_symlink() and path.resolve() == path,
            'Missing, nonregular or symbolic file: ' + str(path))


def verification_tools(tree):
    inventory = []
    for name in VERIFICATION_TOOLS:
        path = ROOT / name
        regular(path)
        data = path.read_bytes()
        record = tree.get(name)
        require(record and record['kind'] == 'blob' and record['mode'] in {'100644', '100755'} and
                record['oid'] == blob_id(data),
                'Private QA tool differs from prepared HEAD Git bytes: ' + name)
        inventory.append({'file': name, 'size': len(data), 'sha256': sha(data)})
    return inventory


def validate_candidate(source, node, branch):
    script = """import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const root=process.argv[1];
const {validateEcasaPublicationCandidate}=await import(pathToFileURL(root+'/scripts/ecasa-publication-candidate.mjs'));
const manifest=JSON.parse(await readFile(root+'/data/ecasa-publication-candidate.json','utf8'));
console.log(JSON.stringify(await validateEcasaPublicationCandidate(manifest,{root})));"""
    env = {'PATH': str(Path(node).resolve().parent) + os.pathsep + os.defpath,
           'VERCEL_GIT_COMMIT_REF': branch}
    result = subprocess.run([node, '--input-type=module', '-e', script, str(source)],
                            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
    data = json.loads(result.stdout)
    require(data.get('eligible') is True and data.get('baselineCommit') == BASELINE and
            data.get('reviewCommit') == REVIEW and len(data.get('selectedResources', [])) == 92 and
            data.get('actionAuthorization') == {'production': False, 'mergeMain': False} and
            data.get('technicalYapoFileIdentityVerified') is False,
            'Candidate validation lost its explicit content/action boundary')
    return data


def expected_private_sources(candidate):
    records = {}
    for name in ('brochures-aj-urbana.json', 'brochures-ingevec.json', 'brochures-ecasa.json'):
        for project in read_json(ROOT / 'data' / name)['projects']:
            for asset in [*project['images'], *(model['plan'] for model in project['models'])]:
                records[asset['localPath'].lstrip('/')] = asset['sha256']
    official, _ = release.official_manifest_inventory(read_json(ROOT / release.OFFICIAL_MANIFEST))
    owner, _ = release.owner_manifest_inventory(read_json(ROOT / release.OWNER_MANIFEST),
                                              read_json(ROOT / release.MANUAL_MANIFEST))
    records.update({name: row['sha256'] for name, row in {**official, **owner}.items()})
    selected = {row['localPath'].lstrip('/') for row in candidate['selectedResources']}
    private = {name: digest for name, digest in records.items()
               if name not in selected and not name.startswith('assets/propiedades/aj-urbana-preview/')}
    require(len(private) == 217 and sum(name.startswith('assets/propiedades/ingevec-preview/')
                                      for name in private) == 165,
            'Existing private source selection differs from165Ingevec+52unused/original sources')
    return private, {name for name, row in {**official, **owner}.items() if row['kind'] == 'original'}


def source_inventory(names, tree, candidate):
    private, original_paths = expected_private_sources(candidate)
    inventory, untracked = [], set()
    selected = {row['localPath'].lstrip('/'): row for row in candidate['selectedResources']}
    for name in names:
        release.safe_name(name, original_paths)
        path = ROOT / name
        regular(path)
        data = path.read_bytes()
        record = tree.get(name)
        if record is None:
            require(name in private and sha(data) == private[name], 'Unapproved or changed private input: ' + name)
            untracked.add(name)
        else:
            require(record['kind'] == 'blob' and record['mode'] in {'100644', '100755'} and
                    record['oid'] == blob_id(data), 'Source differs from committed Git bytes: ' + name)
        if name in selected:
            require(record is not None and sha(data) == selected[name]['sha256'] and
                    len(data) == selected[name]['bytes'], 'Every selected Ecasa resource must be exact and committed: ' + name)
        inventory.append({'file': name, 'size': len(data), 'sha256': sha(data),
                          'gitBlob': blob_id(data), 'gitTracked': record is not None})
    require(untracked == set(private), 'Private inputs must be exactly the existing217-source allowlist')
    require(all(name in names and name in tree for name in selected), 'Selected Ecasa Git asset omitted from source')
    return inventory


def build(source, node, environment, branch):
    env = {'PATH': str(Path(node).resolve().parent) + os.pathsep + os.defpath,
           'VERCEL_ENV': environment, 'VERCEL_GIT_COMMIT_REF': branch,
           'SOLLAHMS_BROCHURE_PROFILE': 'public-web'}
    result = subprocess.run([node, str(source / 'scripts/package-vercel.mjs')], cwd=source,
                            env=env, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output = json.loads(result.stdout)
    require(output.get('environment') == environment and output.get('noindex') == (environment == 'preview') and
            output.get('independentEcasaContentEligible') is True and
            output.get('selectedBrochureMedia') == 354 and output.get('ecasaReviewMedia') == 85 and
            output.get('ecasaGalleryImages') == 72 and output.get('officialPublishedMedia') == 2 and
            output.get('ownerPublishedMedia') == 5 and output.get('officialSourceMedia') == 4 and
            output.get('ownerSourceMedia') == 10,
            'Build changed approved candidate selection or review environment controls')
    return output, read_json(source / '.vercel/brochure-build-inventory.json')


def verify_build_receipt(receipt, candidate):
    proof = receipt.get('independentEcasaCandidate')
    require(proof and proof.get('manifestSha256') == candidate['manifestSha256'] and
            proof.get('baselineCommit') == BASELINE and proof.get('reviewCommit') == REVIEW and
            proof.get('publicContentEligible') is True and proof.get('productionActionAuthorized') is False and
            proof.get('mergeActionAuthorized') is False,
            'Build receipt omitted the validated candidate approval or authorized a forbidden release action')
    actual = {row['path']: row['sha256'] for row in receipt['media'] if row['path'].startswith('/assets/propiedades/ecasa-preview/')}
    actual.update({row['path']: row['sha256'] for key in ('officialOriginals', 'ownerCover')
                   for row in receipt[key]['publishedAssets']})
    require(actual == {row['localPath']: row['sha256'] for row in candidate['selectedResources']},
            'Build receipt differs from the exact92Ecasa publication fingerprints')
    # The legacy contract flag remains false. Ecasa eligibility comes from the
    # separate specific owner attestation, not a fabricated contract annex.
    require(receipt.get('contractualCoverageVerified') is False and
            receipt.get('ecasaContractualCoverageVerified') is False and
            receipt.get('preservedContractualCoverageVerified') is True,
            'Historical contractual evidence was silently relabeled as new independently verified Ecasa scope')


def verify_baseline_inventory(directory, records, ignored=()):
    require(isinstance(records, list) and records, 'Verified baseline inventory is required')
    expected = {}
    for row in records:
        name = row.get('file')
        require(isinstance(name, str) and name and not name.startswith('/') and
                '..' not in Path(name).parts and '\\' not in name and name not in expected and
                len(row.get('sha256', '')) == 64, 'Invalid baseline fingerprint inventory')
        path = directory / name
        regular(path)
        require(sha(path.read_bytes()) == row['sha256'], 'Baseline bytes differ from verified receipt: ' + name)
        expected[name] = row['sha256']
    actual = {str(path.relative_to(directory)) for path in directory.rglob('*')
              if path.is_file() and path.relative_to(directory).parts[0] not in ignored}
    require(actual == set(expected), 'Baseline directory has missing or unrecorded files')
    return {'files': len(expected), 'inventorySha256': sha(json.dumps(records, sort_keys=True,
            separators=(',', ':')).encode())}


def baseline_paths(args):
    for name in ('production_source', 'production_public', 'approved_preview'):
        value = getattr(args, name).expanduser().resolve()
        require(value.is_dir() and value != ROOT, 'Verified private baseline directory required: ' + name)
        setattr(args, name, value)
    production = read_json(args.production_source / 'data/proyectos.json')
    require(len(production) == 144 and sum(project['inmobiliaria'] == 'Ecasa' for project in production) == 23,
            'Productionf1 baseline must preserve144projects/23Ecasa')
    require((args.approved_preview / 'data/proyectos.json').is_file(), 'Reviewedfb11 Preview output is unavailable')
    approved = read_json(args.approved_preview / 'data/proyectos.json')
    require(len(approved) == 136 and sum(project['inmobiliaria'] == 'Ecasa' for project in approved) == 15,
            'Reviewedfb11 Preview must preserve136projects/15Ecasa')
    production_receipt = read_json(args.production_baseline_receipt)
    reviewed_receipt = read_json(args.approved_preview_receipt)
    require(production_receipt.get('sourceCommit') == BASELINE and
            reviewed_receipt.get('reviewCommit') == REVIEW and
            reviewed_receipt.get('archive', {}).get('sha256') ==
            '0a49a35054a227fb9743c232d8ec4c78886e995193e4b5724178d7c298f1c272',
            'Baseline receipts are not anchored to actualProductionf1 and approvedfb11')
    return {'productionReceipt': {'path': str(args.production_baseline_receipt.resolve()),
                'sha256': sha(args.production_baseline_receipt.read_bytes())},
            'approvedPreviewReceipt': {'path': str(args.approved_preview_receipt.resolve()),
                'sha256': sha(args.approved_preview_receipt.read_bytes())},
            'productionSource': verify_baseline_inventory(args.production_source,
                production_receipt['sourceFiles'], ignored={'dist', '.vercel', '.git', 'node_modules'}),
            'productionPublic': verify_baseline_inventory(args.production_public, production_receipt['publicFiles']),
            'approvedPreview': verify_baseline_inventory(args.approved_preview, reviewed_receipt['publicOutput'])}


def public_inventory(files):
    return [{'file': name, 'sha256': sha(data), 'size': len(data)} for name, data in files.items()]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-directory', required=True, type=Path)
    parser.add_argument('--node', required=True)
    parser.add_argument('--branch', default=BRANCH)
    parser.add_argument('--production-source', required=True, type=Path)
    parser.add_argument('--production-public', required=True, type=Path)
    parser.add_argument('--approved-preview', required=True, type=Path)
    parser.add_argument('--production-baseline-receipt', required=True, type=Path)
    parser.add_argument('--approved-preview-receipt', required=True, type=Path)
    parser.add_argument('--audit-script', type=Path, default=ROOT / 'tests/audit_ecasa_independent.py')
    parser.add_argument('--platform-reference', type=Path, default=ROOT / 'docs/release-reference.json')
    args = parser.parse_args()
    require(args.branch == BRANCH, 'Only the independent Ecasa preparation branch is authorized')
    require(git('symbolic-ref', '--short', 'HEAD').decode().strip() == BRANCH, 'Source checkout is on another branch')
    commit = git('rev-parse', 'HEAD').decode().strip()
    require(not git('status', '--porcelain', '--untracked-files=all').strip(),
            'Commit and clean the reviewed candidate before preparing a final source archive')
    destination = args.output_directory.expanduser().resolve()
    require(destination != ROOT and ROOT not in destination.parents and destination not in ROOT.parents,
            'Private preparation must remain outside the source checkout')
    require(not destination.exists() or not any(destination.iterdir()), 'Preparation output must be fresh')
    baseline_verification = baseline_paths(args)
    audit = args.audit_script.expanduser().resolve()
    require(audit == ROOT / 'tests/audit_ecasa_independent.py', 'Use the dedicated committed independent auditor')
    regular(audit)
    tree = tree_for(commit)
    require(str(audit.relative_to(ROOT)) in tree and tree[str(audit.relative_to(ROOT))]['oid'] == blob_id(audit.read_bytes()),
            'Independent auditor differs from the prepared Git commit')
    tool_inventory = verification_tools(tree)
    candidate = validate_candidate(ROOT, args.node, args.branch)
    names = sorted(set(bundle.selected_source_files(ROOT)) | CANDIDATE_FILES)
    require(not set(VERIFICATION_TOOLS) & set(names), 'Private QA tools cannot enter runtime source archive')
    inventory = source_inventory(names, tree, candidate)
    source_count = len(inventory)
    tracked_count = sum(row['gitTracked'] for row in inventory)
    require(source_count - tracked_count == 217, 'Unexpected private input count')
    destination.mkdir(parents=True, exist_ok=True, mode=0o700)
    destination.chmod(0o700)
    source = destination / 'source'; source.mkdir(mode=0o700)
    for name in names:
        path = source / name; path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, path)
    require(all(sha((source / row['file']).read_bytes()) == row['sha256'] for row in inventory),
            'Restored source differs from committed/private input inventory')
    require(validate_candidate(source, args.node, args.branch)['manifestSha256'] == candidate['manifestSha256'],
            'Restored candidate manifest differs from source')
    public, preview = destination / 'public-local', destination / 'preview-local'
    shutil.copytree(source, public); shutil.copytree(source, preview)
    public_build, public_receipt = build(public, args.node, 'production', 'main')
    preview_build, preview_receipt = build(preview, args.node, 'preview', args.branch)
    verify_build_receipt(public_receipt, candidate); verify_build_receipt(preview_receipt, candidate)
    require(public_receipt == preview_receipt, 'Public and Preview changed the approved resource inventories')
    public_files, preview_files = bundle.public_files(public / 'dist'), bundle.public_files(preview / 'dist')
    bundle.assert_public_parity(preview_files, public_files)
    require(len(public_files) == len(preview_files) == 1028, 'Independent candidate changed reviewed route/resource count')
    audit_output = destination / 'independent-audit.json'
    subprocess.run([sys.executable, str(audit), '--source', str(source), '--public', str(public / 'dist'),
        '--preview', str(preview / 'dist'), '--production-source', str(args.production_source),
        '--production-public', str(args.production_public), '--approved-preview', str(args.approved_preview),
        '--output', str(audit_output)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    audited = read_json(audit_output)
    require(audited.get('ok') is True or audited.get('passed') is True, 'Independent source/output audit did not pass')
    require(not audited.get('errors') and not audited.get('failures'), 'Independent audit has unresolved failures')
    # Archive only the selected original inputs. dist/.vercel/QA/receipts/PDFs
    # and contractual material cannot enter this source allowlist.
    data = bundle.archive_bytes(source, names)
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as packaged:
        members = packaged.getmembers()
        require([member.name for member in members] == names and all(member.isfile() for member in members),
                'Deterministic archive includes missing, additional or nonregular source members')
        require(all(sha(packaged.extractfile(member).read()) == row['sha256']
                    for member, row in zip(members, inventory)), 'Archive source bytes differ from verified inputs')
    archive = destination / 'source.tgz'; archive.write_bytes(data)
    chunks = []
    for index, start in enumerate(range(0, len(data), 2 * 1024 * 1024), 1):
        fragment = data[start:start + 2 * 1024 * 1024]
        path = destination / ('source.tgz.part' + str(index)); path.write_bytes(fragment)
        chunks.append({'file': '.vercel/' + path.name, 'privatePath': str(path), 'size': len(fragment),
                       'sha': hashlib.sha1(fragment).hexdigest(), 'sha256': sha(fragment)})
    platform = read_json(args.platform_reference)
    require(platform.get('projectId') == 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH' and
            platform.get('teamId') == 'team_A9VNIW2f2K1IJpd2pGdvDmEN' and
            platform.get('productionOrigin') == 'https://sollahms.cl', 'Historical project/team identity changed')
    metadata = {'schemaVersion': 1, 'transport': 'native_source_archive', 'target': 'preview',
        'branch': BRANCH, 'preparedCommit': commit, 'productionBaselineCommit': BASELINE, 'reviewBaselineCommit': REVIEW,
        'contentProfile': PROFILE, 'contentAuthorizedForPublicWeb': True, 'productionActionAuthorized': False,
        'mergeActionAuthorized': False, 'deploymentPerformed': False, 'sourceFileCount': source_count,
        'sourceBytes': sum(row['size'] for row in inventory), 'trackedSourceFiles': tracked_count,
        'privateSourceFiles': 217, 'privateSourceBreakdown': {'Ingevec': 165, 'unusedEcasaOrOriginalInputs': 52},
        'catalogueProjects': 136, 'ecasaProjects': 15, 'otherDeveloperProjects': 121,
        'ecasaCommercialEntries': 22, 'ecasaLegacyRoutes': 8, 'htmlPages': 143,
        'sourceBrochureMedia': 399, 'ecasaSourceMedia': 130, 'selectedBrochureMedia': preview_receipt['media'],
        'ecasaPublishedMedia': 85, 'officialSourceMedia': 4, 'officialPublishedMedia': 2,
        'ownerSourceMedia': 10, 'ownerPublishedMedia': 5, 'ecasaGalleryImages': 72, 'ecasaPlans': 74,
        'candidate': {'manifestSha256': candidate['manifestSha256'], 'selectedResources': candidate['selectedResources'],
                      'contentAuthorization': candidate['contentAuthorization'], 'technicalYapoFileIdentityVerified': False},
        'legacyContractualCoverageVerified': False, 'preservedAJIngevecContractualCoverageVerified': True,
        'EcasaOwnerAttestedPublicWebEligibility': True, 'independentAudit': {'path': str(audit_output), 'sha256': sha(audit_output.read_bytes()), 'passed': True},
        'auditTool': {'path': str(audit), 'sha256': sha(audit.read_bytes())},
        'verificationTools': tool_inventory,
        'archive': {'privatePath': str(archive), 'sha256': sha(data), 'size': len(data)},
        'chunks': chunks, 'files': inventory, 'publicOutput': public_inventory(public_files),
        'previewOutput': public_inventory(preview_files), 'publicWebParityVerified': True,
        'publicBuild': public_build, 'previewBuild': preview_build,
        'buildReceipt': preview_receipt,
        'baselineVerification': baseline_verification,
        'baselines': {'productionSource': str(args.production_source), 'productionPublic': str(args.production_public),
                      'approvedPreview': str(args.approved_preview)}}
    reference = {'schemaVersion': 1, 'contentProfile': PROFILE, 'preparedCommitForReview': commit,
        'developmentBranch': BRANCH, 'productionBaselineCommit': BASELINE, 'approvedReviewCommit': REVIEW,
        'contentAuthorizedForPublicWeb': True, 'productionActionAuthorized': False, 'mergeActionAuthorized': False,
        'archiveSha256': sha(data), 'archiveBytes': len(data), 'sourceFiles': source_count,
        'sourceBytes': metadata['sourceBytes'], 'trackedSourceFiles': tracked_count, 'privateSourceFiles': 217,
        'candidateManifestSha256': candidate['manifestSha256'], 'EcasaSelectedResources': 92,
        **{key: platform[key] for key in ('projectId', 'teamId', 'teamSlug', 'projectName', 'productionOrigin')},
        'auditReceipt': 'independent-audit.json', 'verificationTools': tool_inventory, 'deploymentPerformed': False}
    request = {'target': 'preview', 'contentProfile': PROFILE, 'projectId': platform['projectId'],
        'teamId': platform['teamId'], 'sourceDirectory': str(source),
        'meta': {'githubCommitRef': BRANCH, 'githubCommitSha': commit, 'privateSourceArchiveSha256': sha(data),
                 'sollahmsContentProfile': PROFILE}, 'productionActionAuthorized': False,
        'mergeActionAuthorized': False, 'note': 'Template only; no upload or deployment is performed or authorized by this helper.'}
    for name, value in [('metadata.json', metadata), ('independent-reference.json', reference),
                        ('preview-request-template.json', request), ('build-receipt.json', preview_receipt)]:
        path = destination / name; path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n'); path.chmod(0o600)
    # Local linking only; ignored by source archive/CLI. No env download.
    (source / '.vercel').mkdir(mode=0o700)
    project_link = source / '.vercel/project.json'
    project_link.write_text(json.dumps({'projectId': platform['projectId'], 'orgId': platform['teamId'],
                                     'projectName': platform['projectName']}, indent=2) + '\n'); project_link.chmod(0o600)
    for path in destination.iterdir():
        if path.is_file(): path.chmod(0o600)
    print(json.dumps({'ok': True, 'contentProfile': PROFILE, 'preparedCommit': commit,
        'sourceFiles': source_count, 'trackedSourceFiles': tracked_count, 'privateSourceFiles': 217,
        'EcasaGitResources': 92, 'publicFiles': len(public_files), 'previewFiles': len(preview_files),
        'selectedBrochureMedia': 354, 'EcasaPlans': 74, 'galleryImages': 72,
        'archiveSha256': sha(data), 'archiveBytes': len(data), 'publicWebParityVerified': True,
        'independentAuditPassed': True, 'productionActionAuthorized': False,
        'mergeActionAuthorized': False, 'deploymentPerformed': False}))


if __name__ == '__main__':
    main()
