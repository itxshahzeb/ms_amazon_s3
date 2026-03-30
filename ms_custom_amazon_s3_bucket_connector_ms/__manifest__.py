# -*- coding: utf-8 -*-
################################################################################
#
#    MountSol
#
#    Copyright (C) 2024-TODAY MountSol(<https://www.mountsol.com>).
#    Author: MountSol (contact@mountsol.com)
#
#    You can modify it under the terms of the GNU AFFERO
#    GENERAL PUBLIC LICENSE (AGPL v3), Version 3.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU AFFERO GENERAL PUBLIC LICENSE (AGPL v3) for more details.
#
#    You should have received a copy of the GNU AFFERO GENERAL PUBLIC LICENSE
#    (AGPL v3) along with this program.
#    If not, see <http://www.gnu.org/licenses/>.
#
################################################################################
# -*- coding: utf-8 -*-
{
    'name': 'Ms Custom Bucket Amazon S3 Connector S3',
    'version': '19.0.1.0.0',
    'category': 'Document Management',
    'summary': 'Store and manage Odoo attachments with Amazon S3 Cloud Storage',
    'description': 'See static/description/index.html',
    'author': 'MountSol',
    'website': 'https://www.mountsol.com',
    'company': 'MountSol',
    'maintainer': 'MountSol',
    'support': 'contact@mountsol.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'mail',
        'project',
        'planning',
        'contacts',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/amazon_dashboard_views.xml',
        'views/amazon_upload_file_views.xml',
        'views/res_config_settings_views.xml',
        'data/schedule_action.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'amazon_s3_connector/static/src/js/amazon.js',
            'amazon_s3_connector/static/src/xml/amazon_dashboard_template.xml',
        ],
    },
    'images': [
        'static/description/banner.png',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
    'uninstall_hook': 'uninstall_hook',
}