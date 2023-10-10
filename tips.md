- Uninstall module via RPC:
  ```js
  await fetch(`${window.location.origin}/web/dataset/call_button`, {
    "headers": {
      "content-type": "application/json",
    },
    "body": JSON.stringify({
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
          "args": [[MODULE_ID]],
          "kwargs": {},
          "method": "button_immediate_uninstall",
          "model": "ir.module.module"
        }
      }),
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  }).then(r=>r.json());
  ```

- Check if commit is in the history:
  ```sh
  git merge-base --is-ancestor <commit_you_are_interrested_in> HEAD &&  echo "yes" || echo "no"
  ```

- Uninstall or upgrade badly installed app:
  1. Go to info page of the app
  2. On odooSupport devtool, write:
  ```js
  {
    "state": "installed",
    "latest_version": same as "installed_version"
  }
  ``` 

- Display theme in the apps menu:
  - Bug button
  - Edit Action
  - Delete Domain

- Run a test method
  ```sh
  ./odoo-bin --addons-path=../enterprise/,addons,../design-themes -d test-v16t --test-tags .test_method_name
  ``` 
  