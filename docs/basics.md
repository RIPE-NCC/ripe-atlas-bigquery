# Basics

## Concepts

* Projects
* Datasets
* Tables

* Queries

* Access


## Interfaces

* The web console
* The command line utilities
* Language-specific hooks

`bq query --project_id prod-atlas-project --nouse_legacy_sql ' select column_name, is_nullable, data_type from atlas_measurements.INFORMATION_SCHEMA.COLUMNS where table_name = "traceroute"`


## Efficiency

The cost for a query is related to the volume of data that will be retroeved
from storage, and so it can be useful to think of broad queries that can be
summarised later, rather than queries that summarise too early.

### Partitions

Our main tables are partitioned by day along the `start_time` column. The
granularity on these partitioned is per day, so requesting measurements across
one minute will cost the same to retrieve as measurements for that full day.

Our tables also require a filter against `start_time`, a basic protection to
stop you from accidentally querying many years of data.

### Columnar scoping

> bq query --project_id=prod-atlas-project \
>          --use_legacy_sql=false          \
>          --dry_run                       \
>          'select * from atlas_measurements.ping where timestamp_trunc(start_time, day) = "2020-08-01" '
> Query successfully validated. Assuming the tables are not modified, running
> this query will process upper bound of 103143443924 bytes of data.

The web console indicates the same estimations live, as you edit a query.

But perhaps you don't need to select everything; perhaps you care about, for
example, probes and the targets they're running ping measurements to. You
wouldn't need to select superfluous columns such as the start_time, or the RTT
measurements themselves, or any other metadata. You could instead start from a
more restricted query:

```shell
$ bq query --project_id=prod-atlas-project \
           --use_legacy_sql=false          \
           --dry_run                       \
          'select prb_id, dst_addr from atlas_measurements.ping where timestamp_trunc(start_time, day) = "2020-08-01" '
Query successfully validated. Assuming the tables are not modified, running
this query will process upper bound of 17536398896 bytes of data.
```

That's under 20% of the first query; the costs are not significant on small
data volumes like this, but you'll notice it during development or when running
recurring queries.

In this case, the query is simple and the upper estimate was easy to calculate. The system indicates that's precisely the amount of data that was fetched:

```bash
$ bq show -j prod-atlas-project:EU.bquxjob_4328da65_1753068f44d
Job prod-atlas-project:bquxjob_4328da65_1753068f44d

  Job Type    State      Start Time         Duration         User Email       Bytes Processed   Bytes Billed   Billing Tier   Labels  
 ---------- --------- ----------------- ---------------- ------------------- ----------------- -------------- -------------- -------- 
  query      SUCCESS   16 Oct 10:25:10   0:00:15.877000   sstrowes@ripe.net   17536398896       17537433600    1                      
```

### Maximising the useful output while minimising data

As above, it's generally useful to consider the dimensions along which you want
to cut your data: if you care about (as above) probe IDs, targeted IP
addresses, and a particular time slice, then those are the dimensions that you
can choose to pull from storage to satisfy your query. These are all
specifically retrievable because of the structure of the data: the columns in
the schema and the daily partitioning on start\_time.

If you care about a specific subset within that data, BigQuery must still
retrieve that data for you. That means that even if you throw 90% of the above
data away, you'll still be charged for the bytes retrieved.

A useful way to reshape how you think about problems in BigQuery can be to
perform the same computation across all of the data, and filter later when you
need to. This can apply in specific situations, and it can be useful to modify
your thinking here: rather than being overly specific about targets or
measurement IDs, compute over all of them instead, when the cost is going to be
the same.

Here's a three-stage toy example.

```sql
SELECT   prbId, min(rtt) as min_rtt  FROM     prod.traceroute_atlas_prod,           UNNEST(hops) h,           UNNEST(resultHops) rh  WHERE    startTime >= "2019-11-01T00:00:00"  AND      startTime <  "2019-11-02T00:00:00"  AND      rh.from = "8.8.8.8"  GROUP BY prbId```


### Outro

In short: you can reduce query costs ahead-of-time by knowing what data you
want to retrieve. Don't pull in more days than you need, and don't pull in more
columns that you need.

Aim to be efficient in your queries, and you can get more
out of the system.

