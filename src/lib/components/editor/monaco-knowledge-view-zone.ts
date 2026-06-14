import { mount, unmount } from 'svelte';
import type * as Monaco from 'monaco-editor';
import type { KnowledgeZoneBridge } from '$lib/components/editor/knowledge-zone-bridge.svelte.js';
import KnowledgeZoneHost from '$lib/components/editor/knowledge-zone-host.svelte';

const VIEW_ZONE_ESTIMATE_HEIGHT_PX = 280;
const VIEW_ZONE_MIN_HEIGHT_PX = 48;

export class KnowledgeViewZoneController {
	private zoneId: string | null = null;
	private domNode: HTMLDivElement | null = null;
	private mountHandle: ReturnType<typeof mount> | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
	private layoutRaf = 0;
	private lastHeightPx = 0;

	constructor(private readonly bridge: KnowledgeZoneBridge) {}

	attach(editor: Monaco.editor.IStandaloneCodeEditor) {
		this.editor = editor;
	}

	dispose() {
		cancelAnimationFrame(this.layoutRaf);
		this.removeZone();
		this.editor = null;
	}

	refresh() {
		if (!this.editor || !this.bridge.question) {
			this.removeZone();
			return;
		}

		this.ensureHostMounted();
		this.setupResizeObserver();
		this.scheduleLayout();
	}

	private ensureHostMounted() {
		if (!this.editor) return;

		if (!this.domNode) {
			this.domNode = document.createElement('div');
			this.domNode.className = 'scaffy-knowledge-check-view-zone';
			this.domNode.style.pointerEvents = 'auto';
		}

		if (!this.mountHandle) {
			this.mountHandle = mount(KnowledgeZoneHost, {
				target: this.domNode,
				props: { bridge: this.bridge },
			});
		}

		if (!this.zoneId) {
			const model = this.editor.getModel();
			if (!model) return;

			this.editor.changeViewZones((accessor) => {
				this.zoneId = accessor.addZone({
					afterLineNumber: model.getLineCount(),
					heightInPx: VIEW_ZONE_ESTIMATE_HEIGHT_PX,
					domNode: this.domNode!,
					suppressMouseDown: false,
				});
			});
		}
	}

	private scheduleLayout() {
		cancelAnimationFrame(this.layoutRaf);
		this.layoutRaf = requestAnimationFrame(() => {
			this.applyZoneLayout();
			requestAnimationFrame(() => {
				this.applyZoneLayout();
			});
		});
	}

	private measureHeightPx(): number {
		if (!this.domNode) return VIEW_ZONE_ESTIMATE_HEIGHT_PX;

		return Math.max(
			this.domNode.offsetHeight,
			this.domNode.scrollHeight,
			this.domNode.getBoundingClientRect().height,
			VIEW_ZONE_MIN_HEIGHT_PX,
		);
	}

	private applyZoneLayout() {
		if (!this.editor || !this.domNode || !this.zoneId) return;

		const model = this.editor.getModel();
		if (!model) return;

		const afterLineNumber = model.getLineCount();
		const heightInPx = this.measureHeightPx();

		if (Math.abs(heightInPx - this.lastHeightPx) < 2) {
			return;
		}

		this.lastHeightPx = heightInPx;

		this.editor.changeViewZones((accessor) => {
			accessor.removeZone(this.zoneId!);
			this.zoneId = accessor.addZone({
				afterLineNumber,
				heightInPx,
				domNode: this.domNode!,
				suppressMouseDown: false,
			});
		});
	}

	private setupResizeObserver() {
		if (!this.domNode) return;

		this.resizeObserver?.disconnect();
		this.resizeObserver = new ResizeObserver(() => {
			this.scheduleLayout();
		});
		this.resizeObserver.observe(this.domNode);
	}

	private removeZone() {
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.lastHeightPx = 0;

		if (this.zoneId && this.editor) {
			const zoneId = this.zoneId;
			this.editor.changeViewZones((accessor) => {
				accessor.removeZone(zoneId);
			});
		}

		this.zoneId = null;

		if (this.mountHandle) {
			unmount(this.mountHandle);
			this.mountHandle = null;
		}

		this.domNode = null;
	}
}
