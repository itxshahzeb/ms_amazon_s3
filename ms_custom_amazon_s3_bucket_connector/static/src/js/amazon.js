/** @odoo-module **/
import { registry } from "@web/core/registry";
import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class AmazonDashboard extends Component {
    static template = "AmazonDashboard";

    setup() {
        this.orm = useService('orm');
        this.actionService = useService("action");
        this.notification = useService("notification");

        this.state = useState({
            files: [],
            filteredFiles: [],
            searchQuery: "",
            filterType: "ALL FILES",
            loading: true,
            error: null,
            previewFile: null,
            viewMode: "grid", // "grid" or "list"
            sortField: null,
            sortAsc: true,
        });

        onWillStart(async () => {
            await this.fetchData();
        });
    }

    async fetchData() {
        this.state.loading = true;
        this.state.error = null;
        try {
            const result = await this.orm.call('amazon.dashboard', 'amazon_view_files', ['']);
            if (!result) {
                this.state.error = "Please configure your Amazon S3 access keys in Settings.";
                this.notification.add("Please set up the Access Keys", { type: "warning" });
            } else if (result.error) {
                this.state.error = "Failed to load files: " + result.error;
                this.notification.add("Failed to load files: " + result.error, { type: "warning" });
            } else {
                this.state.files = result;
                this.applyFilters();
            }
        } catch (e) {
            this.state.error = "An unexpected error occurred.";
        }
        this.state.loading = false;
    }

    applyFilters() {
        let files = [...this.state.files];
        // Apply search
        if (this.state.searchQuery) {
            const q = this.state.searchQuery.toLowerCase();
            files = files.filter(f => f.name.toLowerCase().includes(q));
        }
        // Apply type filter
        if (this.state.filterType !== "ALL FILES") {
            files = files.filter(f => {
                const ext = f.extension;
                switch (this.state.filterType) {
                    case "pdf": return ext === "pdf";
                    case "image": return ["jpeg", "jpg", "png", "gif", "bmp", "webp", "svg"].includes(ext);
                    case "zip": return ext === "zip";
                    case "txt": return ["txt", "docx"].includes(ext);
                    case "xlsx": return ext === "xlsx";
                    default: return true;
                }
            });
        }
        // Apply sort
        if (this.state.sortField) {
            const field = this.state.sortField;
            const asc = this.state.sortAsc;
            files.sort((a, b) => {
                const va = (a[field] || "").toString().toLowerCase();
                const vb = (b[field] || "").toString().toLowerCase();
                const cmp = va.localeCompare(vb, undefined, { numeric: true });
                return asc ? cmp : -cmp;
            });
        }
        this.state.filteredFiles = files;
    }

    onSearchInput(ev) {
        this.state.searchQuery = ev.target.value;
        this.applyFilters();
    }

    onFilterChange(ev) {
        this.state.filterType = ev.target.value;
        this.applyFilters();
    }

    sortBy(field) {
        if (this.state.sortField === field) {
            this.state.sortAsc = !this.state.sortAsc;
        } else {
            this.state.sortField = field;
            this.state.sortAsc = true;
        }
        this.applyFilters();
    }

    toggleView(mode) {
        this.state.viewMode = mode;
    }

    selectFile(file) {
        this.state.previewFile = file;
    }

    closePreview() {
        this.state.previewFile = null;
    }

    upload() {
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

    async refresh() {
        this.state.previewFile = null;
        await this.fetchData();
    }

    getFileIcon(file) {
        const ext = file.extension;
        if (file.is_image) return "fa-file-image-o";
        if (file.is_pdf) return "fa-file-pdf-o";
        if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "fa-file-archive-o";
        if (["doc", "docx", "txt", "rtf"].includes(ext)) return "fa-file-text-o";
        if (["xls", "xlsx", "csv"].includes(ext)) return "fa-file-excel-o";
        if (["ppt", "pptx"].includes(ext)) return "fa-file-powerpoint-o";
        if (["mp4", "avi", "mov", "mkv"].includes(ext)) return "fa-file-video-o";
        if (["mp3", "wav", "flac"].includes(ext)) return "fa-file-audio-o";
        return "fa-file-o";
    }

    getIconColor(file) {
        const ext = file.extension;
        if (file.is_image) return "#4CAF50";
        if (file.is_pdf) return "#F44336";
        if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "#FF9800";
        if (["doc", "docx", "txt", "rtf"].includes(ext)) return "#2196F3";
        if (["xls", "xlsx", "csv"].includes(ext)) return "#4CAF50";
        return "#9E9E9E";
    }

    getSortIcon(field) {
        if (this.state.sortField !== field) return "fa-sort";
        return this.state.sortAsc ? "fa-sort-asc" : "fa-sort-desc";
    }
}

registry.category("actions").add("amazon_dashboard", AmazonDashboard);
