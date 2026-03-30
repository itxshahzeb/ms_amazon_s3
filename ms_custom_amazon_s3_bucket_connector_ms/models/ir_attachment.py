from odoo import models, fields


class IrAttachment(models.Model):
    _inherit = "ir.attachment"

    is_file_uploaded = fields.Boolean(string='File Uploaded', default=False)
