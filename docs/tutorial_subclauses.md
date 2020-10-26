## Subqueries

It can be tempting to write queries as compact and as concisely as possible,
but often this is not optimal in terms of iterative development or code
readability.

A common approach when building queries is to construct a series of subqueries
that form a sort of a pipeline: this has the advantage that each individual
step can be self-contained, tested and verified separately, and becomes much
simpler to reason about.

Let's take a trivial example. In the [traceroute](measurements_traceroute.md)
tables, IP addresses appear in multiple places. If we want to process all,
having them in separate columns may not be ideal, but a simple select won't cut it:

```sql
select src_addr, synth_addr, dst_addr, hop_addr
from  `ripencc-atlas`.samples.traceroute, unnest(hops)
```

This will obviously return two columns. If we want to simply retrieve a list of
IP addresses, one of the easiest ways is to deconstruct the select into
multiple subqueries.

For example:

```sql
with src_ips as
(
  select src_addr as ip
  from  `ripencc-atlas`.samples.traceroute
  where  date(start_time) = "2020-10-01"
),

dst_ips as
(
  select dst_addr as ip
  from  `ripencc-atlas`.samples.traceroute
  where  date(start_time) = "2020-10-01"
),

synth_ips as
(
  select synth_addr as ip
  from  `ripencc-atlas`.samples.traceroute
  where  date(start_time) = "2020-10-01"
),

hop_ips as
(
  select hop_addr as ip
  from  `ripencc-atlas`.samples.traceroute, unnest(hops)
  where  date(start_time) = "2020-10-01"
),

combined_ips as
(
  select * from src_ips
  union all
  select * from dst_ips
  union all
  select * from synth_ips
  union all
  select * from hop_ips
)

select distinct ip
from combined_ips
```

This ultimately splits out the IP addresses from each of the columns and
renames them all as `ip`, before performing a union over all of the resulting
tables from the subqueries, then finally running `distinct` over them at the
end to create a list of unique IPs observed in this table.

## Filtering tables prior to processing

Subqueries come into their own when you have multiple tables to work with and
you want to filter data prior to attempting to do additional computation.

Let's say we want to compare probes where we have DNS responses and ping RTTs
to the same resolver. Conceptually it can be simplest to pull the relevant
columns and dates early in the code, and manage them from there. We can build
subqueries to perform queries like this as follows:

```sql
with dns_rtts as
(
  select prb_id, dst_addr, response_time
  from  `ripencc-atlas`.samples.dns
  where  date(start_time) = "2020-10-01"
),

ping_rtts as
(
  select prb_id, dst_addr, rtt
  from  `ripencc-atlas`.samples.ping, unnest(pings)
  where  date(start_time) = "2020-10-01"
)

select *
from   ping_rtts
join   dns_rtts
using(prb_id, dst_addr)
```


