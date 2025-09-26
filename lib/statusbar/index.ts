import { createSignal, createMemo } from '@lib/reactivity';

type StatusBarComponent = () => string;

export class StatusBarManager {
    private readonly leftComponents;
    private readonly setLeftComponents;
    private readonly rightComponents;
    private readonly setRightComponents;

    public readonly leftText;
    public readonly rightText;

    constructor() {
        const [left, setLeft] = createSignal<StatusBarComponent[]>([]);
        this.leftComponents = left;
        this.setLeftComponents = setLeft;

        const [right, setRight] = createSignal<StatusBarComponent[]>([]);
        this.rightComponents = right;
        this.setRightComponents = setRight;

        this.leftText = createMemo(() => {
            return this.leftComponents().map(c => c()).join('  ');
        });

        this.rightText = createMemo(() => {
            return this.rightComponents().map(c => c()).join('  ');
        });
    }

    public addLeft(component: StatusBarComponent) {
        this.setLeftComponents([...this.leftComponents(), component]);
    }

    public addRight(component: StatusBarComponent) {
        this.setRightComponents([...this.rightComponents(), component]);
    }
}
