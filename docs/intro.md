# RIPE Atlas in BigQuery

Google BigQuery is a data warehousing platform with an SQL interface on top to allow fast query access to data.

The RIPE Atlas network measurement platform conducts network measurements, and
makes them available via the RIPE Atlas API. The API provides some
opportunities to filter data, but little in terms of compute.

To bridge this gap, we are now storing RIPE Atlas data in Google BigQuery.

That offers a ridiculous advantage: using BigQuery, we can slice the data along any dimension we care about.

We're going to start with the following offering:

(list of tables)
(list of time ranges)

These documents are intended to bootstrap folks into querying this data, but
they're definitely not everything you can do. We're hoping, after some time
using this data, to learn more about how best to structure it, what tables
would be useful for us to generate on your behalf, and how you're using it all.


## Datasets

We're making the following datasets available on Google BigQuery:

* [Ping](ping.md)
* [Traceroute]()
* [DNS]()
* [HTTP]()
* [SSL]()
* [NTP]()

