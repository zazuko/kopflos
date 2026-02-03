import {Transform, TransformCallback} from "node:stream";
import {KopflosEnvironment} from "@kopflos-cms/core";
import type {ResultType} from '../queries/page-patterns.rq'

const groupRegex = /\(\?<(?<groupName>\w+)>.+\)/


export default class extends Transform {
    constructor(private pagePatterns: ResultType, private env: KopflosEnvironment) {
        super({
            objectMode: true,
        });
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        if(chunk.predicate.equals(this.env.ns.schema.mainEntityOfPage)) {
            const { pagePattern, resourcePattern } = this.pagePatterns.find(binding => binding.pagePattern.equals(chunk.object)) ?? {}
            let pageUrl: string | undefined;
            const groups = chunk.subject.value.match(new RegExp(resourcePattern!.value))?.groups
            pageUrl = pagePattern?.value?.replace(groupRegex, (_, groupName) => {
                return groups?.[groupName] ?? ''
            }).replace(/\$$/, '')

            if (pageUrl) {
                return callback(undefined, this.env.quad(chunk.subject, chunk.predicate, this.env.namedNode(pageUrl)))
            }
        }

        return callback(undefined, chunk)    }
}
