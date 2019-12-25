const NULL = Symbol('null')
export const UNDEFINED = Symbol('undefined')
export type Option<A> = typeof UNDEFINED | A
const THIS = Symbol('this')

export interface Store<A> {
    wChild?: WeakMap<any, Store<A>>;
    oChild?: Map<any, Store<A>>;
    leaf?: A | typeof UNDEFINED;
}

function setWeakChild<A>(store: Store<A>, key : object) : Store<A> {
    if (!store.wChild) store.wChild = new WeakMap<any, Store<A>>()
    const s1 = store.wChild.get(key)
    if (s1) return s1
    const res : Store<A> = {}
    store.wChild.set(key, res)
    return res
}

function setOtherChild<A>(store : Store<A>, key : any) : Store<A> {
    if (!store.oChild) store.oChild = new Map()
    const s1 = store.oChild.get(key)
    if (s1) return s1;
    const res = {} as Store<A>
    store.oChild.set(key, res)
    return res
}


function trValue(value : any) : any {
    if (value === null) return NULL
    if (value === undefined) return UNDEFINED
    return value
}

export function setCache<A>(store : Store<A>, args : any[] , value : A) {
    for (const a of args) {
        const key = trValue(a)
        if (typeof key === 'object') {
            store = setWeakChild(store, key)
        } else {
            store = setOtherChild(store, key);
        }
    }

    store.leaf = value
}


export function getCache<A>(store: Store<A>, args : any[]) : A|typeof UNDEFINED {
    for (const a of args) {
        const key = trValue(a)
        if (typeof key === 'object') {
            if (!store.wChild) return UNDEFINED
            const s1 = store.wChild.get(key)
            if (!s1) return UNDEFINED
            store = s1
        } else {
            if (!store.oChild) return UNDEFINED
            const s1 = store.oChild.get(key)
            if (!s1) return UNDEFINED
        }
    }

    if (store.hasOwnProperty('leaf')) return store.leaf as A
    return UNDEFINED
}
