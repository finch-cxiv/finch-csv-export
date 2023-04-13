# finch-csv-export

[the Finch API](https://tryfinch.com/) provides access to over 190 HRIS and payroll systems and returns data in a JSON format - a common business format for data analysis is a [flat CSV](https://en.wikipedia.org/wiki/Comma-separated_values) that teams can read in excel

this application transforms Finch JSON data into a flat CSV that can be exported and opened in Excel, Google Sheets etc.

when configured with an access token, this application will export [pay-statements](https://developer.tryfinch.com/docs/reference/d5fd02c41e83a-pay-statement) dated with a start_date and an end_date

[pay-statements](https://developer.tryfinch.com/docs/reference/d5fd02c41e83a-pay-statement) are flattened to the pay-statement-line-level (that is some unique combination of individual_id + payment_id) and enhanced with [payment](https://developer.tryfinch.com/docs/reference/b811fdc2542ca-payment) date (for payment dates) and [directory](https://developer.tryfinch.com/docs/reference/12419c085fc0e-directory) data (for individual names)

***


## 🚀 getting started

### prerequisites:

[Register](https://dashboard.tryfinch.com/signup) for a Finch sandbox application and [generate an access token](https://developer.tryfinch.com/docs/reference/00c032eb7c265-quickstart)

### basic setup:

define the necessary Finch configuration values within the index.js script as follows:

```
# your access token
grand_object.AUTHORIZATION=Bearer <YOUR ACCESS TOKEN>
```
### start local application:

1. start by installing the dependencies of this project: `npm install`

2. then, run the server: `node index.js`

3. now you can make a POST request to http://localhost:3000/export-csv-pay-statements with the request body below (adjust dates as necessary)

```
# request body

{
start_date: "2022-08-01",
end_date: "2022-01-01",
}

```

***
### notes:

#### [live demo tool](https://finch.cxiv.io/) | [CSV export structure](https://docs.google.com/spreadsheets/d/1jSZI8QgFJ5MIGMB_mTqaNPKRfjTL1Cb7jcOq0HU9ffA/edit#gid=2037396068)

#### ~

#### node version: [v16.19.1](https://nodejs.org/en/blog/release/v16.19.1) | node modules: [express](https://www.npmjs.com/package/express) | [node-fetch@2](https://www.npmjs.com/package/node-fetch) | [body-parser](https://www.npmjs.com/package/body-parser) | [cors](https://www.npmjs.com/package/cors) | [lodash](https://lodash.com/)

#### ~

reach out to christian@tryfinch.com with any questions

