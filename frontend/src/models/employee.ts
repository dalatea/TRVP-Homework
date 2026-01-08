import { Request } from './request'

export class Employee {
    constructor(
        public fullname: string,
        public requests: Request[],
        public readonly id: number
    ) {
    }
}
