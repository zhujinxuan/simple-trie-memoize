import {Gen, MemoSpec} from './gen'

const THIS = Symbol('this')


interface F<Args extends any[], B> {
    (...args: Args): B;
}

const world = new WeakMap<F<any, any>, Gen<any>>()

function getGen<Args extends any[], B>(x : F<Args, B>, spec : MemoSpec) : Gen<B>{
    let res = world.get(x)
    if (res) return res as Gen<B>
    res = new Gen<B>(spec)
    world.set(x, res)
    return res
}

function memo<Args extends any[], B>(x: F<Args, B>, spec : MemoSpec): typeof x {
    const gen = getGen(x, spec)
    return function (this : any, ...args: Args) : B {
        const ignoreThis = spec.ignoreThis || !x.prototype
        const cargs = ignoreThis ? args : [this, THIS, ...args]
        const evalBy = () => x(...args)
        return gen.once(cargs, evalBy)
    }
}
