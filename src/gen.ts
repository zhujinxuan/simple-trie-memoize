import {getCache, Store, UNDEFINED, setCache, Option} from './store';
import { v4 as uuid } from 'uuid';

export class Gen<A> {
    ss : [[Store<A>, string], ...[Store<A>, string][]] = [this.mkStore()]
    count : number = 0;
    maxStores?: number;
    maxEntries?: number;
    lifetime?: number;

    constructor(s : MemoSpec) {
        this.maxStores = s.maxStores
        this.maxEntries = s.maxEntriesInStore
        this.lifetime = s.storeLifeTime
        this.regLife(this.ss[0][1])
    }

    mkStore() : [Store<A>, string] {
        const id = uuid()
        this.regLife(id)
        return [{}, id]
    }

    regLife(id : string) {
        if (this.lifetime === undefined) return;
        setTimeout(() => {
            const {ss} = this;
            const index = ss.findIndex(([_, i]) => (i === id))
            if (index === -1) return;
            if (index === 0 && this.ss.length === 1) {
                ss[0] = this.mkStore()
                return;
            }
            ss.splice(index, 1)
        }, this.lifetime)
    }

    once(args : any[], evalBy : () => A) : A {
        for (const [store] of this.ss) {
            const res = getCache(store, args)
            if (res !== UNDEFINED) return res
        }

        const res = evalBy()
        setCache(this.ss[0][0], args, res)
        this.addEntry()
        return res
    }

    addEntry() {
        if (this.maxEntries === undefined) return;
        this.count++;
        if (this.count < this.maxEntries) return;
        this.ss.unshift(this.mkStore())
        this.addStore()
    }

    addStore() {
        if (this.maxStores === undefined) return;
        const {ss} = this
        if (ss.length < this.maxStores) return;
        ss.pop()
        if (ss.length === 0) {
            ss.unshift(this.mkStore())
        }
    }

}

export interface MemoSpec {
    ignoreThis?: boolean;
    maxStores?: number;
    maxEntriesInStore?: number;
    storeLifeTime?: number;
}
