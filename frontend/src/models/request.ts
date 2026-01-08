import type { Facility } from './facility'

export class Request {
    public start_booking: Date
    public end_booking: Date

    constructor(
        public readonly id: number,
        public facility: Facility,
        start_booking: Date | string,
        end_booking: Date | string
    ) {
        this.start_booking = this.toDate(start_booking)
        this.end_booking = this.toDate(end_booking)
    }

    private toDate(v: Date | string): Date {
        if (v instanceof Date) return v

        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
            return new Date(`${v}T00:00:00`)
        }

        return new Date(v)
    }
}
