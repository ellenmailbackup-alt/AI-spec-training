# Story 5.2 — Performance Optimization

## User Story 5.2.1: Optimize Dashboard Query Performance

**As a** developer
**I want to** ensure dashboard loads in <2 seconds
**So that** users have a good experience

**Priority:** MEDIUM (can be done after Epic 1 MVP)
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Dashboard API endpoint responds in <2 seconds with typical dataset (10,000 sales, 500 products)
- [ ] Database queries use appropriate indexes:
  - Index on `sales.date`
  - Index on `sales.status`
  - Index on `sales.channel`
  - Composite index on `(status, date)` for common queries
  - Index on `stockMovements.product_id`
  - Index on `saleItems.product_id`
- [ ] Query execution plans reviewed (EXPLAIN) to ensure index usage
- [ ] Load testing performed with realistic data volume
- [ ] If response time still >2s, consider query result caching (Redis)
- [ ] Document caching strategy if implemented

**Index Creation Script:**
```sql
-- Add indexes for dashboard performance
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_status_date ON sales(status, date); -- Composite for common queries
-- Channel and date indexes already created in User Story 5.1.1 and 5.1.2

CREATE INDEX idx_stock_movements_product_id ON stockMovements(product_id);
CREATE INDEX idx_sale_items_product_id ON saleItems(product_id);
```

**Load Testing:**
- Use tool like Apache JMeter or k6
- Simulate 100 concurrent users requesting dashboard
- Measure average, p95, p99 response times
- Target: Average <2s, p95 <3s

**Caching Strategy (if needed):**
- **Cache Layer:** Redis
- **Cache Key:** `dashboard:main:{current_date}`
- **TTL:** 5 minutes
- **Invalidation:**
  - On sale create/update
  - On stock movement create
  - Or rely on TTL for simplicity (5-minute stale data acceptable)

**Dependencies:**
- User Story 1.9.1 (Dashboard API must exist)

**Testing Notes:**
- Test query performance with EXPLAIN
- Verify indexes used (not full table scans)
- Load test with 10,000 sales
- Load test with 50,000 sales (future-proofing)
- Test cache (if implemented): Verify cached data served, verify TTL expiration
- Monitor production performance after deployment
