// Paste this in the console while on odoo.com

odoo.define("@search_utils" + Math.random(), ["@web/session"], async function (require) {
  const { session } = require("@web/session");
  const parser = new DOMParser();

  async function search_read(model, domain, fields) {
    const response = await fetch("https://www.odoo.com/web/dataset/call_kw/project.task/search_read", {
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        method: "call",
        jsonrpc: "2.0",
        params: {
          args: [],
          kwargs: {
            domain,
            limit: 2000,
            offset: 0,
            order: "",
            fields,
          },
          model,
          method: "search_read",
        },
      }),
      method: "POST",
      mode: "cors",
      credentials: "include",
    }).then((r) => r.json())
    return response.result;
  }

  function searchTasks(partnerId) {
    return search_read(
      "project.task",
      [["message_follower_ids.partner_id", "=", partnerId]],
      ["id"]
    ).then(r => r.map(t => t.id));
  }

  function searchMessages(taskIds, searchString, caseSensitive) {
    return search_read(
      "mail.message",
      [
        ["model", "=", "project.task"],
        ["res_id", "in", taskIds],
        ["body", caseSensitive ? "like" : "ilike", searchString],
      ],
      ["record_name", "res_id", "author_id", "body"]
    );
  }

  function normStr(str) {
    return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  function formatSearchResult(m, searchString, caseSensitive) {
    const normSS = normStr(searchString)
    const content = normStr(parser.parseFromString(m.body, "text/html").body.textContent);
      const i = caseSensitive
        ? content.indexOf(normSS)
        : content.toLowerCase().indexOf(normSS.toLowerCase());
      if (i === -1) return null;

      let sub =
        content.substring(Math.max(0, i - 80), i) +
        `%c${content.substring(i, i + searchString.length)}%c` +
        content.substring(i + searchString.length, Math.min(content.length, i + 80));

      sub = "…" + sub.trim() + "…"
      return {
        title: m.record_name,
        taskId: m.res_id,
        author: m.author_id[1],
        text: sub 
      };
  }

  function filterDuplicateResults(results) {
    const newResults = [];
    results.forEach((r, i) => {
      if (results.some((other, j) => i < j && other.taskId == r.taskId && other.text == r.text)) return;
      newResults.push(r);
    });
    return newResults;
  }

  function logResult(result) {
    console.log(
      `%c${result.title}%c ` +
      `https://www.odoo.com/odoo/49/tasks/${result.taskId}\n` +
      result.author + "\n\n" +
      result.text + "\n",
      "font-weight: bold;",
      "font-weight: normal;",
      "font-weight: bold;",
      "font-weight: normal;",
    );
  }

  async function search(searchString, caseSensitive = false) {
    const partnerId = session.storeData.Persona[1].id;
    const taskIds = await searchTasks(partnerId);
    const messages = await searchMessages(taskIds, searchString, caseSensitive);

    console.log(messages);
    let results = messages
      .map(m => formatSearchResult(m, searchString, caseSensitive))
      .filter(m => m);
    results = filterDuplicateResults(results);
    results.forEach(logResult);
  }

  search("SEARCH_STRING");

});
console.log('Searching...');