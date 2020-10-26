# Notes on Cost Efficiency

The cost for a query is related to the volume of data that will be retrieved
from storage. The number of compute cycles spent on that data is not relevant,
so in the most abstract sense it's most cost-efficient to retrieve as little
data as possible, and extract as much as possible from it.

This page aims to outline how to achieve that.

## Development: iteration

When you're developing a query, it generally makes little sense to repeatedly
query a large dataset. Undoubtedly a full dataset may contain more edge cases
that your code will have to handle, but in many cases it can make sense to
minimise the data you're sketching your queries out against.

The `samples` dataset is an example of how to do this. Those tables were
generated with queries similar to this query:

```sql
create table your_dataset.your_table
as select *
from     `ripencc-atlas`.measurements.traceroute
where     date(start_time) = "2020-10-01"
and       RAND() <= 1/100
```

This will
[create](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language#create_table_statement)
a table from the traceroute table, selecting only one day of data, and
selecting when `RAND()` returns a value under 0.01. That is: retain
approximately 1% of all rows. With a small table, you can iterate repeatedly
while you develop and debug.



## Partitioned tables

Large tables can be
[partitioned](https://cloud.google.com/bigquery/docs/partitioned-tables)
against specific columns, which provides a transparent way to reduce the volume
of data BigQuery must retrieve in order to satisfy a query.

The data in the `measurements` dataset is partitioned by day on `start_time` column. The
granularity on these partitioned is per day, so one day will cost approximatley
half as much as two days, and so forth. This means it can be extremely
important to constrain your query to the time range you care about.

This level of granularity also means there's a minimum point where there is no
cost advantage to reducing the time window. Requesting all rows in a 24 hour
period will cost the same as requesting all rows in one minute inside that 24
hour period; think of it like having daily tarballs of your data, and having to
decompress the whole thing and scan the data inside that day to find the specific
rows you want.


## Columnar scoping

Additionally, BigQuery won't retrieve columns that you don't request. Consider
(for example) the [traceroute](measurements_traceroute.md) table: the `hops`
array in each row contains a lot of data, but if you're only interested in the
destinations that a probe targets (and not the responses contained in the data)
then you would not select this column. This significantly reduces the amount of
data that must be retrieved, and therefore also the cost.


## Maximising the useful output while minimising data

Given the above, and given the size of some datasets, constraining along
partitioned columns and selecting only the columns you care about can still
leave a lot of data, and you're spending the money one way or another.

Depending on the nature of your work, you may consider whether you need one
specific answer, or if writing the output of a more general query into a much
smaller table is a better approach.

Here's a toy example. Let's say we want to know the minimum RTT to
8.8.8.8 from all probes. That can be accomplished with the following query:

```sql
select   prb_id, min(rtt) as min_rtt 
from    `ripencc-atlas`.measurements.traceroute, unnest(hops) h
where    date(start_time) = "2020-10-01"
and      af = 4
and      h.hop_addr = "8.8.8.8"
group by prb_id
```

This query definitely does the job, but in order to do it, it has to throw away
all the other results.

For the same cost, it can be reformulated as:

```sql
select   prb_id, hop_addr, min(rtt) as min_rtt 
from    `ripencc-atlas`.measurements.traceroute, unnest(hops) h
where    date(start_time) = "2020-10-01"
group by prb_id, hop_addr
```

This query will retain a minimum RTT to _any_ IP that responded to any probe,
and you can store this (much smaller) result in a table if you think you'll
consult it in the future.



## In summary?


As above, it's generally useful to consider the dimensions along which you want
to cut your data: if you care about (as above) probe IDs, targeted IP
addresses, and a particular time slice, then those are the dimensions that you
can choose to pull from storage to satisfy your query.

Consider how you develop your queries: prototype against small datasets if you can.

Then consider the dimensions you are about:
* consider how you partition large tables, and constrain the timeframe you're looking at against our tables
* consider the columns you need to retrieve to answer the questions you have




## Estimating costs

```shell
bq query --project_id=prod-atlas-project \
         --use_legacy_sql=false          \
         --dry_run                       \
         'select * from atlas_measurements.ping where timestamp_trunc(start_time, day) = "2020-08-01" '
Query successfully validated. Assuming the tables are not modified, running
this query will process upper bound of 103143443924 bytes of data.
```

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

## Outro

In short: you can reduce query costs ahead-of-time by knowing what data you
want to retrieve. Don't pull in more days than you need, and don't pull in more
columns that you need.

Aim to be efficient in your queries, and you can get more
out of the system.

