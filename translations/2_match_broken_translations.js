/**
 * Set `translations14` to be the result of 1_fetch_pre_update_translations.js
 * then run this script in the post-upgrade database.
 */

/// translations14 = ...

await main();

async function main() {
  const translations16 = await websiteViewsTranslations();
  const matching = matchTranslationsVersions(translations16, translations14);
  const result = matching.reduce((acc, cur) => {
    if (!acc[cur.view_id]) {
      acc[cur.view_id] = {};
    }
    if (!acc[cur.view_id][cur.lang]) {
      acc[cur.view_id][cur.lang] = {};
    }
    acc[cur.view_id][cur.lang][cur.src] = cur.value;
    return acc;
  }, {});
  return result;
}



async function websiteViewsTranslations() {
  const views = await websiteViews();
  const translations = await Promise.all(views.map(v => getViewTranslations(v.id)));
  return translations
    .map((t, i) => t[0].map(x => ({res_id: views[i].id, ...x}))).flat()
    .reduce((acc, cur) => {
      if (!acc[cur.res_id]) {
        acc[cur.res_id] = [];
      }
      acc[cur.res_id].push({view_id: cur.res_id, lang: cur.lang, src: cur.source, value: cur.value});
      return acc;
    }, {});
}

function websiteViews() {
  return searchRead("ir.ui.view", [["website_id","!=",false], ["xml_id","=",false], ["arch_updated","=",true]], ["id", "name"]);
}

function getViewTranslations(view_id) {
  return rpcCall("ir.ui.view", "get_field_translations", [[view_id], "arch_db"])
}



function matchTranslationsVersions(translations16, translations14) {
  const matching = [];
  Object.entries(translations16).forEach(([view_id, translations]) => {
    if (!(view_id in translations14)) return;
    const trans16 = translations;
    const trans14 = textTranslations(translations14[view_id]);
    trans16.forEach(t => {
      if (t.value) return;

      const corresponding = findCorresponding(t, trans14);
      if (corresponding) {
        matching.push({...t, value: corresponding.value})
      }
    });
  });
  return matching;
}

function textTranslations(trans) {
  return trans.map(t => ({...t, text: parseText(t.src)}));
}

function findCorresponding(t, trans14) {
  const text16 = parseText(t.src);
  return trans14.find(t14 => t14.lang === t.lang && t14.text === text16);
}

function write(model, ids, values) {
  return rpcCall(model, "write", [ids, values], {
    "context": {"active_test": false}
  });
}

function searchRead(model, domain, fields) {
  return rpcCall(model, "search_read", [], {
    "context": {"active_test": false},
    domain,
    "offset": 0,
    "order": "",
    fields,
  });
}

async function rpcCall(model, method, args = [], kwargs = {}) {
  return (await fetch(`/web/dataset/call_kw/${model}/${method}`, {
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
        "params": { args, kwargs, model, method },
    }),
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  }).then(r=>r.json())).result;
}


function parseText(htmlStr) {
  const doc = parseHtml(htmlStr.replace(/&?(amp;|nbsp;)/g,''));
  const textContent = doc.textContent.trim().replace(/[^\w\d]/g,'');
  return textContent;
}

function parseHtml(htmlStr) {
  return (new DOMParser()).parseFromString(htmlStr, 'text/html').body;
}