# Evaluating the pings table

Let's get started just by accesing the `ping` table and build up a small query.
Let's say we want to know the minimum RTT to any target from any probe, for
each day we have data.

First let's take a couple of diversions to follow the language. It may be worth
opening the [ping schema](measurements_ping.md) to glance at.

Let's just familiarise ourselves with the language by grabbing a column, the target IP addresses:

```sql
select dst_addr
from  `ripencc-atlas`.samples.ping
```

This is about as simple and as lightweight as we can go. This is going to do no
aggregation and no calculation over any of the data, it'll simply return any
`dst_addr`, i.e. the target IP address for the measurement, that exists in the
data.

That's not especially useful, but for the sake of interest, let's aggregate a little bit. Let's say we want to know which IP addresses are the "heavy-hitters" in the dataset:

```sql
select dst_addr, count(*) c
from  `ripencc-atlas`.samples.ping
group by dst_addr
order by c desc
```

This is already doing much more! Some things to note:

* `count()` is an aggregate function, and the language requires that you make your intent for the other columns clear. The `group by` clause indicates that the `count()` should be grouped by `dst_addr`.
* `count(*) c` is going to name the resulting column `c`, rather than give it a temporary name
* `order by c desc` is going to order the results in descending order, so we'll see immediately who the top hits are.

This gets us one step closer. We're interested in the RTTs to each destination by probe, so let's think about selecting by probe:

```sql
select prb_id, dst_addr, count(*) c
from  `ripencc-atlas`.samples.ping
group by prb_id, dst_addr
order by c desc
```

We can simply add the `prb_id` column, and make sure we group by it. The above
will still order by the top-hitters, but the groups are smaller. We could
equally `order by prb_id, c desc` if we wanted to view the results by `prb_id`
first.

Now let's try to get to the meat of the results: the actual measured RTTs.
Notice that they're embedded inside an array of structs; arrays require a
little bit of extra work. We simply cannot do the following:

```sql
select prb_id, dst_addr, pings.rtt
from  `ripencc-atlas`.samples.ping
```

The language simply won't allow that; arrays must be `unnest()`ed first. Let's say we have a small table with the following columns:

```
 prb_id   | dst_addr          | pings[rtt]
----------+-------------------+---------------
 14277    | 213.133.109.134   | 21.79902
          |                   | 21.81758
          |                   | 24.965825
```

In the real table, the array has multiple fields, but the principle is the same: to get at the `rtt` values, we must `unnest()`. An `unnest()` will unbundle each of the entries in the array and map it back to the parent row, creating a table that looks like this:

```
 prb_id   | dst_addr          | rtt
----------+-------------------+---------------
 14277    | 213.133.109.134   | 21.79902
 14277    | 213.133.109.134   | 21.81758
 14277    | 213.133.109.134   | 24.965825
```

From there, we can easily process the RTT values.

Applying this to the real table can work as follows:


```sql
select prb_id, dst_addr, rtt
from  `ripencc-atlas`.samples.ping, unnest(pings)
```

This is going to unbundle all those RTT values and give us a table with the
three columns we care about.

Note that if we want all columns from the struct embedded in the `pings` array,
you can name the unnested result as (for example) `unnest(pings) p`, then
`select ... p.*`.

To get closer to answering the question, we need to aggregate: `min()` is one of the basic aggregation functions, and it'll work much as `count()` did earlier:

```sql
select prb_id, dst_addr, min(rtt) min_rtt
from  `ripencc-atlas`.samples.ping, unnest(pings)
group by prb_id, dst_addr
```

At this point we observe `null` values in the `min_rtt` column, a reality of the
data we're querying: sometimes, targets don't respond or the responses are
lost. We don't care about those, so let's exclude them:

```sql
select prb_id, dst_addr, min(rtt) min_rtt
from  `ripencc-atlas`.samples.ping, unnest(pings)
where rtt is not null
group by prb_id, dst_addr
```

This is almost the answer to our question. But we wanted this aggregated as the
minimum per day, so let's take a look at one more column: `start_time`.
`start_time` is when the actual ping measurement started on the probe.
But the granularity is wrong: it's a timestamp to the millisecond granularity.
There are useful [timestamp
functions](https://cloud.google.com/bigquery/docs/reference/standard-sql/timestamp_functions)
that help us here. In particular, `timestamp_trunc()`, which can mask
timestamps to certain granularities, including `week`, `day`, `hour, etc.
We'll truncate to `day`. So let's add in our truncated timestamp:

```sql
select timestamp_trunc(start_time, day) day, prb_id, dst_addr, min(rtt) min_rtt
from  `ripencc-atlas`.samples.ping, unnest(pings)
where rtt is not null
group by day, prb_id, dst_addr
order by day
```

Note that here, the truncated timestamp is named `day`, and then is included in
the `group by` statement at the end. If you group by `start_time`, BigQuery will accept the
query but you'll lose the granularity in the result (because we're not
selecting that column).

And that's it! This generates a table of results that you can store elsewhere,
or download, or continue processing further. For example, in some cases `min()`
is precisely what you want, but sometimes you want to know more about the _range_
of values returned.

For that, other functions are available.
[`approx_quantiles()`](https://cloud.google.com/bigquery/docs/reference/standard-sql/approximate_aggregate_functions#approx_quantiles)
is one such example. "Approx" stems from the nature of the computation: some
calculations are difficult to achieve over large datasets, but can be
approximated within reasonable bounds in most cases. As always, it's good to
understand how you're processing your data, and consider how important the
precision of the end result is. For typical cases, `approx_quantiles` is going
to work just fine.

It's use can look like this:

```sql
select timestamp_trunc(start_time, day) day, prb_id, dst_addr, approx_quantiles(rtt, 4 ignore nulls) quantiles
from  `ripencc-atlas`.samples.ping, unnest(pings)
group by day, prb_id, dst_addr
order by day
```

It has the bonus of allowing us to `ignore nulls` in the quantiles call itself.
The number `4` here will generate four partitions, and therefore five buckets.
This will return an array of non-interpolated values at the minimum, 25%, 50%,
75%, and maximum.

