import json,pathlib
R=pathlib.Path(__file__).resolve().parents[1]
out={"schemaVersion":1,"checkedOn":"2026-10-31","license":"ODbL-1.0","attribution":"© OpenStreetMap contributors","lines":[]}
for line,count in [("L7",19),("L8",14),("L9",19)]:
 x=json.loads((R/f"docs/metro-20261030/osm-{line}-route.json").read_text());es=x["elements"];nodes={e["id"]:e for e in es if e["type"]=="node"};rel=next(e for e in es if e["type"]=="relation");ways={e["id"]:e for e in es if e["type"]=="way"}
 paths=[]
 for m in rel["members"]:
  if m["type"]=="way" and m["ref"] in ways:
   w=ways[m["ref"]]
   if w.get("tags",{}).get("railway") in ("construction","proposed"):
    paths.append([[nodes[i]["lon"],nodes[i]["lat"]] for i in w["nodes"]])
 stations=[{"name":e["tags"]["name"],"lat":e["lat"],"lng":e["lon"],"osmId":e["id"]} for e in nodes.values() if e.get("tags",{}).get("name") and (e.get("tags",{}).get("ref") if line!="L9" else e["id"] in {m["ref"] for m in rel["members"] if m["type"]=="node"})]
 assert len(stations)==count and paths
 out["lines"].append({"id":line,"name":"Línea "+line[1:],"status":"Futura · no operativa","color":rel["tags"]["colour"],"source":"https://www.openstreetmap.org/relation/"+str(rel["id"]),"paths":paths,"stations":stations})
(R/"data/metro-future.json").write_text(json.dumps(out,ensure_ascii=False,separators=(",",":"))+"\n")
