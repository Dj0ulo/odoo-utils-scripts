from odoo import http
from odoo.http import request


class DevTools(http.Controller):
    @http.route('/dev/autologin', type='http', auth='none', csrf=False)
    def autologin(self, to='/web/tests'):
        if not request.db:
            return request.not_found()

        host = request.httprequest.host
        if host == 'portal.localhost:8069':
            login = 'portal'
        elif host == 'demo.localhost:8069':
            login = 'demo'
        else:
            login = 'admin'

        user = request.env(su=True)['res.users'].search([('login', '=', login)], limit=1)
        if not user:
            return request.not_found()

        request.session.uid = user.id
        request.session.login = user.login
        request.session.db = request.db
        request.session.session_token = user._compute_session_token(request.session.sid)

        return request.redirect(to)
