# Set `translations`` to be the result of 2_match_broken_translations.js
# then run this in a server action.
# The output is the list of the views that were updated

# translations = {}

output = []

def print(str=''):
    output.append(str)

def update_view_translation(view_id, lang, value):
    env.cr.execute("UPDATE ir_ui_view SET arch_db=jsonb_set(arch_db, %s, %s) where id=%s",
                   ('{'+lang+'}', json.dumps(value), view_id))

def get_view_json(view_id):
    env.cr.execute(f"SELECT arch_db FROM ir_ui_view where id=%s", (view_id,))
    return env.cr.fetchall()[0][0]

def translate_views():
    for view_id in translations:
        print(view_id)

        arch_db = get_view_json(view_id)
        for lang in translations[view_id]:
            result = arch_db[lang] if lang in arch_db and arch_db[lang] else arch_db[list(arch_db.keys())[0]]
            for substr in translations[view_id][lang]:
                result = result.replace(substr, translations[view_id][lang][substr])
            update_view_translation(view_id, lang, result)

translate_views()

env['ir.ui.view'].clear_cache()
env.cr.commit()

raise UserError('\n'.join(output))