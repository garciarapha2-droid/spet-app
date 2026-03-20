# CEO Dashboard — Mapeamento Backend

## Legenda de Status
- **EXISTE** = Endpoint pronto, retorna dados reais
- **ADAPTAR** = Endpoint existe mas precisa ajuste no payload
- **CRIAR** = Não existe, precisa implementar

---

## PRIORIDADE 1

### 1. Overview Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| MRR Card | MRR mensal | `/api/ceo/overview-metrics` | GET | `metrics.mrr` | tap_sessions | EXISTE | P1 |
| Net New MRR Card | Variação MRR | `/api/ceo/overview-metrics` | GET | `metrics.net_new_mrr` | tap_sessions | EXISTE | P1 |
| Active Customers | Clientes ativos | `/api/ceo/overview-metrics` | GET | `metrics.active_customers` | user_access | EXISTE | P1 |
| Churn Rate | % churn | `/api/ceo/overview-metrics` | GET | `metrics.churn_rate` | tap_sessions | EXISTE | P1 |
| ARPU | Receita média/cliente | `/api/ceo/overview-metrics` | GET | `metrics.arpu` | calculado | EXISTE | P1 |
| LTV/CAC Ratio | Razão LTV/CAC | `/api/ceo/overview-metrics` | GET | `metrics.ltv_cac_ratio` | calculado | EXISTE | P1 |
| Growth % | Crescimento MoM | `/api/ceo/overview-metrics` | GET | `metrics.growth_pct` | tap_sessions | EXISTE | P1 |
| ARR Card | Receita anual recorrente | `/api/ceo/overview-metrics` | GET | `metrics.arr` | calculado | EXISTE | P1 |
| Revenue Today/YTD | Receita hoje/acumulada ano | `/api/ceo/overview-metrics` | GET | `metrics.revenue_today/ytd` | tap_sessions | EXISTE | P1 |
| MRR Trend Chart | Gráfico 12 meses | `/api/ceo/overview-metrics` | GET | `charts.mrr_trend` | tap_sessions | EXISTE | P1 |
| Customer Trend Chart | Gráfico crescimento | `/api/ceo/overview-metrics` | GET | `charts.customer_trend` | users | EXISTE | P1 |
| Revenue Breakdown Chart | Stacked MRR | `/api/ceo/overview-metrics` | GET | `charts.revenue_breakdown` | tap_sessions | EXISTE | P1 |
| Total Leads/Paid Leads | Leads no sistema | `/api/ceo/overview-metrics` | GET | `metrics.total_leads/paid_leads` | leads | EXISTE | P1 |

### 2. Executive Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| KPI Cards (MRR, Revenue, Profit) | KPIs executivos | `/api/ceo/health` | GET | `kpis.*` | tap_sessions | EXISTE | P1 |
| KPI Drill-down | Breakdown por venue | `/api/ceo/kpi-breakdown?kpi=mrr` | GET | `venues[]` | tap_sessions | EXISTE | P1 |
| Revenue vs Profit Chart | Gráfico comparativo | `/api/ceo/revenue?period=month` | GET | `chart[]` | tap_sessions | EXISTE | P1 |
| Targets / Goals | Metas e progresso | `/api/ceo/targets` | GET | `targets.*` | ceo_targets (mongo) | EXISTE | P1 |
| Set/Update Targets | Criar/editar metas | `/api/ceo/targets` | POST | body | ceo_targets (mongo) | EXISTE | P1 |
| Alerts | Alertas operacionais | `/api/ceo/alerts` | GET | `alerts[]` | calculado | EXISTE | P1 |
| Companies List | Empresas/clientes | `/api/ceo/companies` | GET | `companies[]` | user_access+mongo | EXISTE | P1 |
| Module Usage | Uso de módulos | `/api/ceo/modules` | GET | `modules[]` | user_access | EXISTE | P1 |
| Pipeline Summary | Pipeline de vendas | `/api/ceo/pipeline` | GET | `pipeline.*` | leads | EXISTE | P1 |

### 3. Revenue Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| MRR Total | MRR atual | `/api/ceo/revenue-detailed` | GET | `metrics.mrr` | tap_sessions | EXISTE | P1 |
| Expansion MRR | MRR expansão | `/api/ceo/revenue-detailed` | GET | `metrics.expansion_mrr` | calculado | EXISTE | P1 |
| Contraction MRR | MRR contração | `/api/ceo/revenue-detailed` | GET | `metrics.contraction_mrr` | calculado | EXISTE | P1 |
| Churned MRR | MRR perdido | `/api/ceo/revenue-detailed` | GET | `metrics.churned_mrr` | calculado | EXISTE | P1 |
| Net New MRR | MRR líquido novo | `/api/ceo/revenue-detailed` | GET | `metrics.net_new_mrr` | calculado | EXISTE | P1 |
| ARR | Receita anual | `/api/ceo/revenue-detailed` | GET | `metrics.arr` | calculado | EXISTE | P1 |
| Net Cash Flow | Fluxo caixa líquido | `/api/ceo/revenue-detailed` | GET | `metrics.net_cash_flow` | calculado | EXISTE | P1 |
| MRR Growth % | Crescimento MRR | `/api/ceo/revenue-detailed` | GET | `metrics.mrr_growth_pct` | calculado | EXISTE | P1 |
| Daily Revenue Chart (30d) | Gráfico diário | `/api/ceo/revenue-detailed` | GET | `charts.daily_revenue` | tap_sessions | EXISTE | P1 |
| Monthly MRR Chart (12m) | Gráfico mensal | `/api/ceo/revenue-detailed` | GET | `charts.monthly_mrr` | tap_sessions | EXISTE | P1 |
| Cash Flow Chart | Gráfico cash flow | `/api/ceo/revenue-detailed` | GET | `charts.cash_flow` | calculado | EXISTE | P1 |

### 4. Cash Flow & MRR Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Cash Flow Metrics | Net cash, MRR, costs | `/api/ceo/cash-flow` | GET | `metrics.*` | tap_sessions | CRIAR | P1 |
| Burn Rate | Taxa de queima | `/api/ceo/cash-flow` | GET | `metrics.burn_rate` | calculado | CRIAR | P1 |
| Runway | Meses de runway | `/api/ceo/cash-flow` | GET | `metrics.runway_months` | calculado | CRIAR | P1 |
| Cash Flow Chart | In/Out mensal | `/api/ceo/cash-flow` | GET | `charts.monthly_flow` | tap_sessions | CRIAR | P1 |
| MRR Evolution | MRR stacked | `/api/ceo/revenue-detailed` | GET | `charts.monthly_mrr` | tap_sessions | EXISTE | P1 |

---

## PRIORIDADE 2

### 5. Sales KPIs Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Total Sales | Vendas total mês | `/api/ceo/sales-performance` | GET | `metrics.total_sales` | tap_sessions | EXISTE | P2 |
| Avg Sale | Ticket médio | `/api/ceo/sales-performance` | GET | `metrics.avg_sale` | tap_sessions | EXISTE | P2 |
| Sales Count | Número de vendas | `/api/ceo/sales-performance` | GET | `metrics.count_sales` | tap_sessions | EXISTE | P2 |
| Monthly Sales Chart | Gráfico mensal | `/api/ceo/sales-performance` | GET | `charts.monthly_sales` | tap_sessions | EXISTE | P2 |
| Win Rate | Taxa de conversão | `/api/ceo/sales-performance` | GET | `metrics.win_rate` | ADAPTAR — add win_rate | ADAPTAR | P2 |

### 6. Lead Breakdown Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Total Leads | Leads total | `/api/ceo/marketing-funnel` | GET | `metrics.total_leads` | leads | EXISTE | P2 |
| Leads Today/Month | Leads por período | `/api/ceo/marketing-funnel` | GET | `metrics.leads_today/month` | leads | EXISTE | P2 |
| Conversion Rates | Lead→Trial→Paid | `/api/ceo/marketing-funnel` | GET | `metrics.lead_to_trial/trial_to_paid` | leads+users | EXISTE | P2 |
| Funnel Chart | Funil visual | `/api/ceo/marketing-funnel` | GET | `charts.funnel` | leads | EXISTE | P2 |
| Source Breakdown | Origem dos leads | `/api/ceo/marketing-funnel` | GET | `charts.sources` | leads | EXISTE | P2 |
| Monthly Leads Chart | Leads por mês | `/api/ceo/marketing-funnel` | GET | `charts.monthly_leads` | leads | EXISTE | P2 |
| Lead List | Lista de leads | `/api/ceo/leads` | GET | `leads[]` | leads | EXISTE | P2 |
| Update Lead Status | Mover lead no funil | `/api/ceo/leads/{id}/status` | PUT | body | leads | EXISTE | P2 |

### 7. Customer Lifecycle Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Total Customers | Clientes total | `/api/ceo/customer-lifecycle` | GET | `metrics.total_customers` | user_access | EXISTE | P2 |
| New/Lost This Month | Novos vs perdidos | `/api/ceo/customer-lifecycle` | GET | `metrics.new/lost_this_month` | users | EXISTE | P2 |
| Retention Rate | % retenção | `/api/ceo/customer-lifecycle` | GET | `metrics.retention_rate` | calculado | EXISTE | P2 |
| Revenue per Customer | Receita por cliente | `/api/ceo/customer-lifecycle` | GET | `metrics.rev_per_customer` | calculado | EXISTE | P2 |
| Customer Growth Chart | Gráfico crescimento | `/api/ceo/customer-lifecycle` | GET | `charts.customer_growth` | users | EXISTE | P2 |
| Rev per Customer Chart | Gráfico receita/cliente | `/api/ceo/customer-lifecycle` | GET | `charts.rev_per_customer` | calculado | EXISTE | P2 |

### 8. CAC & Metrics Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| LTV | Lifetime Value | `/api/ceo/growth-metrics` | GET | `metrics.ltv` | calculado | EXISTE | P2 |
| CAC | Custo Aquisição | `/api/ceo/growth-metrics` | GET | `metrics.cac` | calculado | EXISTE | P2 |
| LTV/CAC Ratio | Razão LTV/CAC | `/api/ceo/growth-metrics` | GET | `metrics.ltv_cac_ratio` | calculado | EXISTE | P2 |
| Payback Period | Meses para payback | `/api/ceo/growth-metrics` | GET | `metrics.payback_months` | calculado | EXISTE | P2 |
| New Customers Chart | Novos clientes/mês | `/api/ceo/growth-metrics` | GET | `charts.new_customers` | users | EXISTE | P2 |
| Churn Trend Chart | Tendência churn | `/api/ceo/growth-metrics` | GET | `charts.churn_trend` | tap_sessions | EXISTE | P2 |
| LTV vs CAC Chart | Gráfico comparativo | `/api/ceo/growth-metrics` | GET | `charts.ltv_vs_cac` | calculado | EXISTE | P2 |

### 9. Conversion Rate Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Lead→Trial % | Taxa conversão lead | `/api/ceo/marketing-funnel` | GET | `metrics.lead_to_trial` | leads+users | EXISTE | P2 |
| Trial→Paid % | Taxa conversão trial | `/api/ceo/marketing-funnel` | GET | `metrics.trial_to_paid` | leads+users | EXISTE | P2 |
| Qualified→Win % | Taxa qualificado→ganho | `/api/ceo/marketing-funnel` | GET | `metrics.qualified_to_win` | leads | EXISTE | P2 |
| Monthly Conversion Chart | Conversão por mês | `/api/ceo/conversion-rates` | GET | `charts.monthly` | leads+users | CRIAR | P2 |

---

## PRIORIDADE 3

### 10. CRM Pipeline Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Pipeline Summary | Estágios + valores | `/api/ceo/pipeline` | GET | `pipeline.*` | leads | EXISTE | P3 |
| Lead List | Lista completa | `/api/ceo/leads` | GET | `leads[]` | leads | EXISTE | P3 |
| Update Lead | Mover no pipeline | `/api/ceo/leads/{id}/status` | PUT | body | leads | EXISTE | P3 |
| Pipeline Board | Kanban view data | `/api/ceo/pipeline` | GET | `stages[]` | leads | ADAPTAR | P3 |

### 11. CRM Reports Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Report Metrics | Leads ganhos/perdidos | `/api/ceo/crm-reports` | GET | `metrics.*` | leads | CRIAR | P3 |
| Win/Loss Chart | Gráfico win/loss | `/api/ceo/crm-reports` | GET | `charts.win_loss` | leads | CRIAR | P3 |
| Source Performance | ROI por fonte | `/api/ceo/crm-reports` | GET | `charts.source_perf` | leads | CRIAR | P3 |

### 12. Security Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Risk Score | Score de risco geral | `/api/ceo/risk-dashboard` | GET | `metrics.risk_score` | calculado | EXISTE | P3 |
| Total Incidents | Incidentes total | `/api/ceo/risk-dashboard` | GET | `metrics.total_incidents` | calculado | EXISTE | P3 |
| Critical Count | Incidentes críticos | `/api/ceo/risk-dashboard` | GET | `metrics.critical_incidents` | calculado | EXISTE | P3 |
| Alerts List | Lista de alertas | `/api/ceo/risk-dashboard` | GET | `alerts[]` | calculado | EXISTE | P3 |
| Severity Breakdown | Por severidade | `/api/ceo/risk-dashboard` | GET | `severity_breakdown` | calculado | EXISTE | P3 |

### 13. Startup KPIs Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Burn Rate | Taxa de queima | `/api/ceo/startup-kpis` | GET | `metrics.burn_rate` | calculado | CRIAR | P3 |
| Runway | Meses restantes | `/api/ceo/startup-kpis` | GET | `metrics.runway_months` | calculado | CRIAR | P3 |
| MoM Growth | Crescimento mensal | `/api/ceo/startup-kpis` | GET | `metrics.mom_growth` | tap_sessions | CRIAR | P3 |
| Rule of 40 | Métrica SaaS | `/api/ceo/startup-kpis` | GET | `metrics.rule_of_40` | calculado | CRIAR | P3 |
| Magic Number | Eficiência vendas | `/api/ceo/startup-kpis` | GET | `metrics.magic_number` | calculado | CRIAR | P3 |
| Metrics Charts | Gráficos tendência | `/api/ceo/startup-kpis` | GET | `charts.*` | calculado | CRIAR | P3 |

### 14. MRR Retention Dashboard

| Widget/Bloco | Dado Esperado | Endpoint | Método | Payload | Fonte | Status | Prio |
|---|---|---|---|---|---|---|---|
| Net Revenue Retention | NRR % | `/api/ceo/mrr-retention` | GET | `metrics.nrr` | tap_sessions | CRIAR | P3 |
| Gross Revenue Retention | GRR % | `/api/ceo/mrr-retention` | GET | `metrics.grr` | tap_sessions | CRIAR | P3 |
| Cohort Retention | Retenção por cohort | `/api/ceo/mrr-retention` | GET | `charts.cohort` | users+sessions | CRIAR | P3 |
| Retention Curve | Curva de retenção | `/api/ceo/mrr-retention` | GET | `charts.retention_curve` | calculado | CRIAR | P3 |

---

## RESUMO

| Status | Count | Dashboards |
|---|---|---|
| **EXISTE** | 10 dashboards cobertos | Overview, Executive, Revenue, Sales KPIs, Lead Breakdown, Customer Lifecycle, CAC & Metrics, Security + parcial de Conversion e Cash Flow |
| **ADAPTAR** | 2 endpoints | Sales KPIs (add win_rate), CRM Pipeline (kanban format) |
| **CRIAR** | 6 endpoints | Cash Flow, Conversion Rates, CRM Reports, Startup KPIs, MRR Retention, parcial Cash Flow |

## ENDPOINTS A CRIAR (PRIORIDADE 1)

1. `GET /api/ceo/cash-flow` — Métricas e gráfico de cash flow, burn rate, runway
