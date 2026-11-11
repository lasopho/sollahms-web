// Offline recovery from Resend GET /emails/:id output (or its tags array).
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {normalizeAcquisition} from '../assets/js/acquisition-contract.mjs';
export function decodeAcquisitionTags(input) {
  const tags=Array.isArray(input)?input:input?.tags;
  if(!Array.isArray(tags)||tags.length>75||tags.find(t=>t.name==='acquisition_version')?.value!=='1')throw Error('Unsupported acquisition tags');
  const context={request_id:tags.find(t=>t.name==='request_id')?.value},groups={};
  for(const tag of tags){
    const match=/^acq_([a-z_]+)_(\d)$/.exec(tag.name);if(!match)continue;
    if(typeof tag.value!=='string'||tag.value.length>256||!/^[A-Za-z0-9_-]+$/.test(tag.value))throw Error('Invalid tag');
    const group=groups[match[1]]??=[];if(group[Number(match[2])]!==undefined)throw Error('Duplicate chunk');group[Number(match[2])]=tag.value;
  }
  for(const [field,chunks]of Object.entries(groups)){
    for(let i=0;i<chunks.length;i++)if(chunks[i]===undefined)throw Error('Missing chunk');
    context[field]=Buffer.from(chunks.join(''),'base64url').toString('utf8');
  }
  return normalizeAcquisition(context);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const text=readFileSync(0,'utf8');if(text.length>32768)throw Error('Input too large');
  process.stdout.write(JSON.stringify(decodeAcquisitionTags(JSON.parse(text)),null,2)+'\n');
}
