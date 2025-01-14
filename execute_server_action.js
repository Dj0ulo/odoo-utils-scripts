(async () => {
  function rpc(url, params) {
    return fetch(url, {
      headers: {
        accept: "*/*",
        "cache-control": "no-cache",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: Math.random(),
        jsonrpc: "2.0",
        method: "call",
        params,
      }),
      method: "POST",
      mode: "cors",
      credentials: "include",
    }).then((r) => r.json());
  }

  async function execute(code) {
    const modelSearch = await rpc("/web/dataset/call_kw/ir.model/search_read", {
      args: [],
      kwargs: {
        domain: [["model", "=", "ir.actions.server"]],
        limit: 1,
        offset: 0,
        order: "",
        fields: ["id"],
      },
      model: "ir.model",
      method: "search_read",
    });

    if(modelSearch.error) {
      console.error(modelSearch.error.data.message);
      return;
    }

    const saveResponse = await rpc("/web/dataset/call_kw/ir.actions.server/web_save", {
      model: "ir.actions.server",
      method: "web_save",
      args: [
        [],
        {
          name,
          state: "code",
          model_id: modelSearch.result[0].id,
          code,
        },
      ],
      kwargs: {
        specification: {
          name: {},
          state: {},
          model_id: { fields: { display_name: {} } },
          code: {},
        },
      },
    });

    if(saveResponse.error) {
      console.error(saveResponse.error.data.message);
      return;
    }

    const serverActionId = saveResponse.result[0].id;

    const executionResponse = await rpc("/web/dataset/call_button", {
      args: [[serverActionId]],
      kwargs: {},
      method: "run",
      model: "ir.actions.server",
    });

    rpc("/web/dataset/call_kw/ir.actions.server/unlink", {
      model: "ir.actions.server",
      method: "unlink",
      args: [[serverActionId]],
      kwargs: {},
    });


    if(executionResponse.result !== undefined) {
      console.log(executionResponse.result);
    } else if(executionResponse.error) {
      const data = executionResponse.error.data;
      if (data.name == 'odoo.exceptions.UserError') {
        console.log(data.message);
      }
      else {
        const errorLineNumber = parseInt(data.debug.match(/File "ir.actions.server\(\d+,\)", line (\d+),/)[1]);
        const endTraceback = data.debug.search("\n\n");
        const traceback = data.debug.slice(0, endTraceback);
        const errorLine = code.split("\n")[errorLineNumber];
        let errorMessage = 'Line ' + errorLineNumber + ': ';
        errorMessage += errorLine + '\n' + errorMessage.split('').map(_ => ' ').join('');
        errorMessage += errorLine.split('').map(_ => '^').join('') + '\n\n' + traceback;
        console.debug(errorMessage);
      }
    }
  }

  const name = "temp server action";
  const code = `
env.cr.execute("""
SQL QUERY
""")
raise UserError(env.cr.fetchall())
`;
  await execute(code);
})();
