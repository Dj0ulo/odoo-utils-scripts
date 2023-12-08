/**
 * Fetch views ir.translation from Odoo 14 database.
 * 
 * Copy this in the chrome console while connected to the pre-update backup
 */
let translations14 = (await fetch("/web/dataset/call_kw/ir.translation/search_read", {
  "headers": {
    "accept": "*/*",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
  },
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": JSON.stringify({
      "method": "call",
      "jsonrpc": "2.0",
      "params": {
          "args": [],
          "kwargs": {
              "context": {"active_test": false},
              "domain": [["name","=","ir.ui.view,arch_db"],["value","!=",""]],
              "offset": 0,
              "order": "",
              "fields": ["id","res_id","lang","src","value"]
          },
          "model": "ir.translation",
          "method": "search_read"
      }
  }),
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
}).then(r=>r.json())).result;

translations14.reduce((acc, cur) => {
  if (!acc[cur.res_id]) {
    acc[cur.res_id] = [];
  }
  acc[cur.res_id].push({lang: cur.lang, src: cur.src, value: cur.value});
  return acc;
}, {});
