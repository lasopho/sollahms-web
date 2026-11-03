import {createHash,randomUUID} from 'node:crypto';
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
export function createPostgresOutbox({pool,maxAttempts=8,leaseSeconds=30,retrySeconds=5}={}){
  if(typeof pool?.query!=='function'||!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>20||!Number.isInteger(leaseSeconds)||leaseSeconds<15||leaseSeconds>300||!Number.isInteger(retrySeconds)||retrySeconds<1||retrySeconds>3600)throw new Error('Explicit pool and bounded delivery policy required');
  const table='sollahms_private.crm_outbox';
  return {
    async put(id,payload){
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||'')||payload?.requestId!==id)throw new Error('Invalid request identity');
      const body=JSON.stringify(canonical(payload));
      if(Buffer.byteLength(body)>32768)throw new Error('Request too large');
      const fingerprint=createHash('sha256').update(body).digest('hex');
      const result=await pool.query(`INSERT INTO ${table}(id,fingerprint,payload) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET id=excluded.id WHERE crm_outbox.fingerprint=excluded.fingerprint RETURNING id,state`,[id,fingerprint,body]);
      if(result.rowCount!==1)throw new Error('Request identity conflict');
      return{durable:true,id,state:result.rows[0].state};
    },
    async claim(){
      await pool.query(`UPDATE ${table} SET state='failed',lease=NULL,lease_until=NULL,error_code='delivery_exhausted' WHERE state='leased' AND lease_until<=clock_timestamp() AND attempts>=$1`,[maxAttempts]);
      const result=await pool.query(`WITH candidate AS (SELECT id FROM ${table} WHERE attempts<$1 AND ((state='pending' AND available_at<=clock_timestamp()) OR (state='leased' AND lease_until<=clock_timestamp())) ORDER BY available_at,created_at,id FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE ${table} o SET state='leased',attempts=attempts+1,lease=$2,lease_until=clock_timestamp()+make_interval(secs=>$3) FROM candidate c WHERE o.id=c.id RETURNING o.id,o.payload,o.lease,o.attempts`,[maxAttempts,randomUUID(),leaseSeconds]);
      return result.rows[0]??null;
    },
    async complete(id,lease,receipt){
      if(receipt?.requestId!==id||receipt?.state!=='recorded')throw new Error('Invalid CRM receipt');
      const result=await pool.query(`UPDATE ${table} SET state='recorded',recorded_at=clock_timestamp(),receipt=$3,lease=NULL,lease_until=NULL,error_code=NULL WHERE id=$1 AND state='leased' AND lease=$2 AND lease_until>clock_timestamp()`,[id,lease,JSON.stringify({requestId:id,state:'recorded'})]);
      return result.rowCount===1;
    },
    async retry(id,lease){
      const result=await pool.query(`UPDATE ${table} SET state=CASE WHEN attempts>=$3 THEN 'failed' ELSE 'pending' END,available_at=clock_timestamp()+make_interval(secs=>least(3600,$4*power(2,least(attempts-1,10)))::integer),lease=NULL,lease_until=NULL,error_code=CASE WHEN attempts>=$3 THEN 'delivery_exhausted' ELSE 'crm_delivery_unconfirmed' END WHERE id=$1 AND state='leased' AND lease=$2 AND lease_until>clock_timestamp()`,[id,lease,maxAttempts,retrySeconds]);
      return result.rowCount===1;
    },
    async status(id){const result=await pool.query(`SELECT id,state,attempts,error_code FROM ${table} WHERE id=$1`,[id]);return result.rows[0]??null;},
  };
}
