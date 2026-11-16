export function safeUrl(value){try{const u=new URL(value);return ['http:','https:','file:'].includes(u.protocol)?u.protocol+'//'+u.host+u.pathname:u.protocol+'[omitted]';}catch{return String(value||'').split(/[?#]/,1)[0];}}
export function sanitize(value){return String(value||'')
 .replace(/https?:\/\/[^\s"'<>]+/gi,safeUrl)
 .replace(/\b(?:data|blob):[^\s"'<>]+/gi,'[data/blob URL omitted]')
 .replace(/\bBearer\s+[^\s,;"']+/gi,'Bearer [redacted]')
 .replace(/\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,'[redacted JWT]')
 .replace(/\b(?:github_pat_|ghp_|sk-|sbp_|vercel_|re_)[A-Za-z0-9_-]{12,}\b/g,'[redacted credential]')
 .replace(/\b(?:authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|token|secret|password|cookie|signature|credential)\b["']?\s*[:=]\s*["']?[^\s,;}"']+/gi,s=>s.split(/[:=]/,1)[0]+'=[redacted]')
 .replace(/\b(?:(?:request|response)[_-]?)?(?:body|headers)\b["']?\s*[:=][\s\S]*/gi,'[body/headers payload omitted]').slice(0,2500);}
export function captureConsole(message,{origin,intentionalBlocks,knownFullscreen}){
 const type=message.type(),raw=message.text(),location=message.location(),urls=[location.url,...(raw.match(/https?:\/\/[^\s"'<>]+/gi)||[])].filter(Boolean).map(safeUrl);
 let category='unclassified-console-message',reason='Requires review';
 const blocked=intentionalBlocks.find(r=>urls.some(u=>u===r.origin+r.path));
 if(blocked){category=blocked.reason==='google-maps-telemetry-privacy'?'expected-privacy-block':'expected-preview-toolbar-block';reason=blocked.reason;}
 else if(type==='warning'&&raw==="Allow attribute will take precedence over 'allowfullscreen'."&&knownFullscreen){category='known-browser-parser-warning';reason='Pre-existing redundant fullscreen attributes; W3C Permissions Policy 6.3.1.';}
 else if(urls.some(u=>u.startsWith(origin+'/'))){category=type==='error'?'application-console-error':'application-console-warning';reason='Application origin; not explained by an intentional block';}
 return {type,text:sanitize(raw),location:{url:safeUrl(location.url),lineNumber:location.lineNumber,columnNumber:location.columnNumber},category,reason};
}
