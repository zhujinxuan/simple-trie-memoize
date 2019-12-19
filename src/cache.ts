interface Store<A> {
    wChild?: WeakMap<any, Store<A>>;
    strChild?: ChildDict<string, A>;
    normChild?: ChildDict<any, A>;
    leaf?: A|symbol;
}

interface Coerce<A> {
    from(_ : A) : A | symbol;
    to(_ : A | symbol) : A;
}

interface ChildDict<K,A> {
    [key : K] : Store<A>;
}


const world : WeakMap<Coerce<any>, Store<any>> = new WeakMap()
const NULL = Symbol('null')
const UNDEFINED = Symbol('undefined')
const THIS = Symbol('this')
const VALUE = Symbol('VALUE')
const TRUE = Symbol('true')
const FALSE = Symbol('false')
const NAN = Symbol('NaN')

function getCacheStore(i : Coerce<A>) : Store<A> {
    if (!world.has(i)) world.set(i, {} : Store<A>)
    const res : any = world.get(i)
    return res;
}

function trValue<A>(value : ?A|null) : A | Symbol {
    if (value === null) return NULL
    if (value === undefined) return UNDEFINED
    if (value === true) return TRUE
    if (value === false) return FALSE
    if (Number.isNaN(value)) return NAN
    return value
}

function setObjChild<A>(store: Store<A>, key : object) : Store<A> {
    if (!store.wChild) store.wChild = new WeakMap<any, Store<A>>()
    const s1 = store.wChild.get(key)
    if (s1) return s1
    const res : Store<A> = {}
    store.wChild.set(key, res)
    return res
}

function setStrChild<A>(store : Store<A>, key : string) : Store<A> {
    if (!store.strChild) store.strChild = {}
    if (!store.strChild) store.strChild[key] = {}
    return store.strChild[key]
}

function setCahce<A>(coe : Coerce<A>, args : any[] , value : A) {
    store = getCacheStore(coe)
    for (const a of args) {
        const key = trValue(a)
        if (typeof key === 'object') {
            store = setObjChild(store, key)
        } else if (typeof key === 'string') {
            store = setStrChild(store, key)
        } else {
            if (!store.normChild) store.normChild = {}
            if (!store.normChild[key]) store.normChild[key] = {}
            store = store.normChild[key]
        }
    }
    store.leaf = trValue(coe.from(A))
}

function getCachePrime(store: Store<A>, args : any[]) : ?A | Symbol {
    for (const a of args) {
        const key = trValue(a)
        if (typeof key === 'object') {
            if (!store.wChild) return undefined
            const s1 = store.wChild.get(key)
            if (!s1) return undefined
            store = s1
        } else if (typeof key === 'string') {
            if (!store.strChild || !store.strChild[key]) return undefined
            store = store.strChild[key]
        } else {
            if (!store.normChild || !store.normChild[key]) return undefined
            store = store.normChild[key]
        }
    }

    return store.leaf
}

function once<A>(coe : Coerce<A>, args : any[], eval : () => A) : A {
    const c1 = getCachePrime(store, args)
    if (c1 === undefined) {
        const res = eval()
        setCahce(coe, args, res)
        return res
    }
    return coe.to(c1)
}
