// Paste this in the console while on odoo.com

odoo.define("@search_utils" + Math.random(), ["@web/session"], async function (require) {
  const { session } = require("@web/session");
  const partner_id = session.storeData.Persona[1].id;

  async function search_read(model, domain, fields) {
    return (
      await fetch("https://www.odoo.com/web/dataset/call_kw/project.task/search_read", {
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
    ).result;
  }

  async function search(searchString, caseSensitive = false) {
    const task_ids = (
      await search_read(
        "project.task",
        [["message_follower_ids.partner_id", "=", partner_id]],
        ["id"]
      )
    ).map((r) => r.id);

    const messages = await search_read(
      "mail.message",
      [
        ["model", "=", "project.task"],
        ["res_id", "in", task_ids],
        ["body", caseSensitive ? "like" : "ilike", searchString],
      ],
      ["record_name", "res_id", "author_id", "body"]
    );

    function format(messages) {
      const parser = new DOMParser();
      messages
        .map((m) => {
          const content = parser.parseFromString(m.body, "text/html").body.textContent;
        //   const content = m.body;
          const i = caseSensitive
            ? content.indexOf(searchString)
            : content.toLowerCase().indexOf(searchString.toLowerCase());
          let sub = "…";
          if (i >= 0) {
            sub =
              "…" +
              content.substring(Math.max(0, i - 80), i) +
              `**${content.substring(i, i + searchString.length)}**` +
              content.substring(i + searchString.length, Math.min(content.length, i + 80)) +
              "…";
          }
          return [
            `%c${m.record_name}`,
            "font-weight: bold;",
            `https://www.odoo.com/odoo/49/tasks/${m.res_id}\n`,
            m.author_id[1] + "\n\n",
            sub + "\n",
          ];
        })
        .forEach((m) => console.log(...m));
    }
    format(messages);
  }

  search("SEARCH_STRING");
});
