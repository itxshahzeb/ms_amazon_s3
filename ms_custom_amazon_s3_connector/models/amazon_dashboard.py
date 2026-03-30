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
import boto3
import os
import logging
from odoo import models
from datetime import datetime, timedelta, timezone


_logger = logging.getLogger(__name__)


class AmazonDashboard(models.Model):
    """
    Amazon dashboard Model to connect with amazon S3
    """
    _name = 'amazon.dashboard'
    _description = "Amazon Dashboard"

    def amazon_view_files(self):
        """
        Fetch all files from s3 and returns it as a list of dicts.
        """
        access_key = self.env['ir.config_parameter'].get_param(
            'amazon_s3_connector.amazon_access_key')
        access_secret = self.env['ir.config_parameter'].get_param(
            'amazon_s3_connector.amazon_secret_key')
        bucket_name = self.env['ir.config_parameter'].get_param(
            'amazon_s3_connector.amazon_bucket_name')
        if not access_key or not access_secret or not bucket_name:
            return False
        try:
            client = boto3.client('s3', aws_access_key_id=access_key,
                                  aws_secret_access_key=access_secret)
            region = client.get_bucket_location(Bucket=bucket_name)
            client = boto3.client(
                's3', region_name=region['LocationConstraint'],
                aws_access_key_id=access_key,
                aws_secret_access_key=access_secret
            )
            response = client.list_objects(Bucket=bucket_name)
            files = []
            image_extensions = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'}
            for data in response.get('Contents', []):
                if data['Size'] == 0:
                    continue
                url = client.generate_presigned_url(
                    ClientMethod='get_object',
                    Params={'Bucket': bucket_name, 'Key': data['Key']})
                size_bytes = data['Size'] / 1024
                if size_bytes > 1024:
                    size = str(
                        round(data['Size'] / (1024 * 1024), 1)) + ' MB'
                else:
                    size = str(round(data['Size'] / 1024, 1)) + ' KB'
                ext = os.path.splitext(data['Key'])[1].replace('.', '').lower()
                file_type = ext.upper()
                is_image = ext in image_extensions
                is_pdf = ext == 'pdf'
                files.append({
                    'name': data['Key'],
                    'url': url,
                    'file_type': file_type,
                    'last_modified': str(data['LastModified']),
                    'size': size,
                    'is_image': is_image,
                    'is_pdf': is_pdf,
                    'extension': ext,
                })
            return files
        except Exception as e:
            return {'error': str(e)}

    def scheduler_action_amazon_upload(self):
        """
        Schedule Action to Uploads files from JOB, Res.Partner, and Tasks to Amazon S3
        """
        datetime.now(timezone.utc)
        timestamp = 1571595618.0
        datetime.fromtimestamp(timestamp, timezone.utc)  # Compliant
        last_24_hours = datetime.now() - timedelta(hours=24)

        attachment_ids = self.env["ir.attachment"].search(
            [('res_model', 'in', ['res.partner', 'project.task', 'planning.role']),
             ('create_date', '>=', last_24_hours), ('is_file_uploaded', '=', False)])
        try:
            client = boto3.resource(
                's3',
                aws_access_key_id=self.env['ir.config_parameter'].get_param(
                    'amazon_s3_connector.amazon_access_key'),
                aws_secret_access_key=self.env[
                    'ir.config_parameter'].get_param(
                    'amazon_s3_connector.amazon_secret_key'))
            for attachment in attachment_ids:
                client.Bucket(self.env['ir.config_parameter'].get_param(
                    'amazon_s3_connector.amazon_bucket_name')).put_object(
                    Key=attachment.res_model.replace('.','_')+'_pr0ffyd0c_'+str(attachment.res_id)+"_pr0ffyd0c_"+attachment.name,
                    Body=open((attachment._full_path(attachment.store_fname)),
                              'rb'))
                record_id = self.env[attachment.res_model].search([('id','=',attachment.res_id)])
                record_id.message_post(
                    body=f"File {attachment.name} has been successfully uploaded to S3 Bucket",
                    subtype_xmlid='mail.mt_note',
                )
                attachment.is_file_uploaded = True
        except Exception as e:
            _logger.warning('Failed to Upload Files ( %s .)' % e)
