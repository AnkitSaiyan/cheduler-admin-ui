import { AbstractRenderer } from './AbstractRenderer';
declare type RenderType = 'canvas' | 'docs';
export declare class RendererFactory {
    private lastRenderType;
    private rendererMap;
    getRendererInstance(storyId: string, targetDOMNode: HTMLElement): Promise<AbstractRenderer | null>;
    private buildRenderer;
}
export declare const getRenderType: (targetDOMNode: HTMLElement) => RenderType;
export declare function clearRootHTMLElement(renderType: RenderType): void;
export {};
