import { Trigger } from 'kira-nosql';
declare type CachedData = {
    trigger: Trigger;
};
export declare function getCached<N extends keyof CachedData>({ key, builder, }: {
    readonly builder: () => CachedData[N];
    readonly key: N;
}): CachedData[N];
export {};
//# sourceMappingURL=cached.d.ts.map