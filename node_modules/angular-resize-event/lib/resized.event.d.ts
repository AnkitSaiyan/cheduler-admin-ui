export declare class ResizedEvent {
    newRect: DOMRectReadOnly;
    oldRect?: DOMRectReadOnly;
    isFirst: boolean;
    constructor(newRect: DOMRectReadOnly, oldRect: DOMRectReadOnly | undefined);
}
