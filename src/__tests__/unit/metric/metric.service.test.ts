import { Metric } from "src/services/metric/Metric"
import { MetricRepository } from "src/repositories/metric/MetricRepository"

describe("Metric", () => {
  it("orchestrates current and previous calendar periods through MetricRepository", async () => {
    const repository = new MetricRepository()
    repository.findForPeriod = jest.fn().mockResolvedValue([])
    const service = new Metric(repository)

    await service.getMetrics("company-1", new Date("2026-03-15T12:00:00.000Z"))

    expect(repository.findForPeriod).toHaveBeenCalledWith("company-1", new Date("2026-02-01T00:00:00.000Z"), new Date("2026-04-01T00:00:00.000Z"))
  })
})
