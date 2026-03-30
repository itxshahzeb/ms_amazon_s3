/** @odoo-module **/
import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { onWillStart, useRef } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class AmazonDashboard extends Component {
    setup() {
        this.orm = useService('orm');
        this.actionService = useService("action");
        this.rootRef = useRef("root");

        onWillStart(async () => {
            await this.fetch_data();
        });
    }

    async fetch_data() {
        var self = this.actionService;
        this.orm.call('amazon.dashboard', 'amazon_view_files', ['']).then(function (result) {
            if (!result) {
                self.doAction({
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'message': 'Please Setup The Access Keys',
                        'type': 'warning',
                        'sticky': false,
                    }
                });
            } else if (result[0] === 'e') {
                self.doAction({
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'message': 'Failed to Load Files [ ' + result[1] + ' ]',
                        'type': 'warning',
                        'sticky': false,
                    }
                });
            } else {
                var container = document.querySelector('.amazon_s3_files');
                container.innerHTML = '';
                var count = 1;
                result.forEach(function (name) {
                    var tr = document.createElement('tr');
                    tr.className = 'file_row table-secondary';
                    tr.innerHTML = '<td scope="row" style="text-align:center;">' + count + '</td>' +
                        '<td><a class="file_name" href="' + name[1] + '"></a>' + name[0] +
                        '<i class="fa fa-download download_file"></i></td>' +
                        '<td>' + name[2] + '</td><td>' + name[3] + '</td><td>' + name[4] + '</td>';
                    container.appendChild(tr);
                    count++;
                });
            }
        });
    }

    sort_name(ev) {
        var tbody = document.querySelector("#files_table tbody");
        var rows = Array.from(tbody.querySelectorAll("tr"));
        rows.sort(function (a, b) {
            var x = a.querySelector("td:nth-child(2)").textContent.toLowerCase();
            var y = b.querySelector("td:nth-child(2)").textContent.toLowerCase();
            return x.localeCompare(y);
        });
        rows.forEach(function (row) { tbody.appendChild(row); });
    }

    upload(ev) {
        this.actionService.doAction({
            name: "Upload File",
            type: 'ir.actions.act_window',
            res_model: 'amazon.upload.file',
            view_mode: 'form',
            view_type: 'form',
            views: [[false, 'form']],
            target: 'new',
        });
    }

    sort_number(ev) {
        var tbody = document.querySelector('#files_table tbody');
        var rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort(function (a, b) {
            var x = a.querySelector('td:first-child').textContent;
            var y = b.querySelector('td:first-child').textContent;
            return x.localeCompare(y, false, { numeric: true });
        });
        rows.forEach(function (row) { tbody.appendChild(row); });
    }

    search_file(ev) {
        var value = document.querySelector('.amazon_header-search-input').value.toLowerCase();
        document.querySelectorAll('.file_row').forEach(function (row) {
            if (row.textContent.toLowerCase().indexOf(value) > -1) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    filter_files(ev) {
        var value = document.querySelector("#filter").value;
        document.querySelectorAll('.file_row').forEach(function (row) {
            row.style.display = 'none';
            var file_name = row.querySelector('a').textContent;
            var file_type = file_name.slice((file_name.lastIndexOf(".") - 1 >>> 0) + 2);
            if (value === 'ALL FILES') {
                row.style.display = '';
            } else if (value === file_type) {
                row.style.display = '';
            } else if (value === 'image') {
                if (['jpeg', 'jpg', 'png'].includes(file_type)) {
                    row.style.display = '';
                }
            } else if (value === 'txt') {
                if (['txt', 'docx'].includes(file_type)) {
                    row.style.display = '';
                }
            }
        });
    }
}

AmazonDashboard.template = "AmazonDashboard";
registry.category("actions").add("amazon_dashboard", AmazonDashboard);