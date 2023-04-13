const fetch = require("node-fetch");
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
var _ = require('lodash');
app.use(express.text())
app.use(express.urlencoded({ extended: true }))
app.use(cors());
app.use(bodyParser.json());
const port_LOCAL = 3000

var server_LOCAL = app.listen(port_LOCAL, () => {
    console.log(`finch-csv-export listening on port ${port_LOCAL}`)
})

var grand_object = {
    URL_FINCH: "https://api.tryfinch.com",
    FINCH_API_VERSION: "2020-09-17",
    AUTHORIZATION: "Bearer <YOUR ACCESS TOKEN>",
    directory: "empty",
    payment: "empty",
    payment_id: {requests:"empty"},
    pay_statement: "empty",
    status: { directory: "null", payment: "null", pay_statement: "null" },
    csv_date_query: "empty"
};

var URL_REQUEST = "";
var HEADERS = { nothing: "nothing" };
var DATA_R = { nothing: "nothing" };

app.get('/', (req, res) => {
    console.log("/root request just ran")
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.send("just a root - the Finch CSV export API is up and running")
    res.end();
})

app.get('/hello', (req, res) => {
    console.log("/hello ran")
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.send("the Finch CSV export API is up and running")
    res.end();
})

app.post('/export-csv-pay-statements', (req, res) => {
    console.log("/export-csv-pay-statements ran")
    grand_object.csv_date_query = req.body
    transform()
    .then((response) => {
        if (response.type === "CSV") {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="pay-statements.csv"');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(response.data)
            res.end();
          } 
        else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(response.data)
            res.end();
        }   
    })
})

async function api_finch(resource, method, data, params) {
    URL_REQUEST = grand_object.URL_FINCH + resource + new URLSearchParams(params).toString()
    console.log(URL_REQUEST)
    if (resource === '/auth/token') {
        HEADERS = {
            'Content-Type': 'application/json'
        }
    }
    else {
        HEADERS = {
            Authorization: grand_object.AUTHORIZATION,
            'Finch-API-Version': grand_object.FINCH_API_VERSION,
            'Content-Type': 'application/json'
        }
    }

    if (method === 'GET') {
        var BODY_R = null
    }
    else {
        var BODY_R = JSON.stringify(data)
    }

    var data_resolve = await fetch(URL_REQUEST, { method: method, headers: HEADERS, body: BODY_R })
        .then(data => data.json())
        .then(data => {
            DATA_R = data
            return (DATA_R)
        })
        .catch((error) => {
            console.error(error)
        })
    return data_resolve
}
// ORIGINAL CODE BELOW
// ORIGINAL CODE BELOW
// ORIGINAL CODE BELOW
// ORIGINAL CODE BELOW
// ORIGINAL CODE BELOW
// ORIGINAL CODE BELOW
// ORIGINAL CODE BELOW
// ORIGINAL CODE BELOW
// ORIGINAL CODE BELOW

// FIRST FUNCTION - everything flows from here
// this where we execute initial network calls to get directory+payment+pay-statement data from Finch for transformation

async function transform() {
      //DIRECTORY
      grand_object.directory = await api_finch('/employer/directory', 'GET', 'null');
      if (grand_object.directory.code === 429) {
        return {type:"JSON",data: grand_object.directory};
      }
      
      //PAYMENT
      grand_object.payment = await api_finch('/employer/payment?', 'GET', null, grand_object.csv_date_query)
      length_payment = grand_object.payment.length
      if (grand_object.payment.code === 400 || grand_object.payment.code === 429) {
        return {type:"JSON",data: grand_object.payment};
      }
      else if (length_payment === 0) {
        return {type:"JSON",data: {status:"ERROR",code:"400",notes:"no payments for selected range - please expand date range"}};
      }

      //PAY-STATEMENT
      grand_object.payment_id.requests = grand_object.payment.map((item) => {return { payment_id: item.id };});
      grand_object.pay_statement = await api_finch('/employer/pay-statement', 'POST', grand_object.payment_id)


      var export_array = build_flat_list_deliver(grand_object.directory, grand_object.payment, grand_object.pay_statement);
      var csv_complete = export_csv(export_array)

      return {type:"CSV",data: csv_complete};
  
}

// this function builds the full array table that is subsequently converted into a CSV by function export_csv
// CALLED BY: function kickoff_process
function build_flat_list_deliver(DIRECTORY, PAYMENT, PAYMENT_STATEMENT) {

    var complete_JSON_table = build_json_table(DIRECTORY, PAYMENT, PAYMENT_STATEMENT)
    var column_groups = build_column_groups(complete_JSON_table)
    var length_complete_JSON_table = complete_JSON_table.length

    console.log('complete_JSON_table')
    console.log(complete_JSON_table)
    console.log("----------------------------------------------------------------------------------------------------")

    console.log('column_groups')
    console.log(column_groups)
    console.log("----------------------------------------------------------------------------------------------------")

    var header_base = [
        ['group', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['type', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['name', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['employer/pre_tax', '-', '-', '-', '-', '-', '-', '-', '-'],
        ['-', 'name', 'pay_date', 'debit_date', 'pay_period', 'type', 'total_hours', 'gross_pay', 'net_pay'],
    ]

    var height_header_base = header_base.length
    console.log('HEIGHT HEADER BASE')
    console.log(height_header_base)

    var complete_array_table = header_base

    //first column just appends alll the -s
    for (let i = 0; i < length_complete_JSON_table; i++) {
        complete_array_table.push(['-'])
    }

    //name column
    col_a = 1
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].first_name + '~' + complete_JSON_table[i].last_name
    }

    //pay_date column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].pay_date
    }

    //debit_date column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].debit_date
    }

    //pay_period column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].pay_period.start_date + ' - ' + complete_JSON_table[i].pay_period.end_date
    }

    //type column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].type
    }

    //total_hours column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].total_hours
    }

    //gross_pay column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].gross_pay.amount
    }

    //net_pay column
    col_a++
    for (let i = 0; i < length_complete_JSON_table; i++) {
        row_a = i + height_header_base
        complete_array_table[row_a][col_a] = complete_JSON_table[i].net_pay.amount
    }

    //EARNINGS COLUMNS
    column_groups_earnings = column_groups.earnings
    length_column_groups_earnings = column_groups_earnings.length
    if (length_column_groups_earnings > 0) {
        for (let i = 0; i < length_column_groups_earnings; i++) {
            col_a++
            HEADER_current_earning = column_groups_earnings[i]
            filter_type = HEADER_current_earning.type
            filter_name = HEADER_current_earning.name
            var header_values = ['EARNINGS', filter_type, filter_name, '---', 'amount']
            for (let row_a = 0; row_a < height_header_base; row_a++) {
                complete_array_table[row_a][col_a] = header_values[row_a]
            }
            for (let i = 0; i < length_complete_JSON_table; i++) {
                row_a = i + height_header_base
                row_a_list = complete_JSON_table[i].earnings
                row_a_list = _.filter(row_a_list, ['type', filter_type])
                row_a_list = _.filter(row_a_list, ['name', filter_name])
                length_row_a_list = row_a_list.length
                if (length_row_a_list === 0) {
                    complete_array_table[row_a][col_a] = '---'
                }
                else {
                    complete_array_table[row_a][col_a] = row_a_list[0].amount
                }
            }

        }

    }

    //TAXES COLUMNS
    column_groups_taxes = column_groups.taxes
    length_column_groups_taxes = column_groups_taxes.length
    if (length_column_groups_taxes > 0) {
        for (let i = 0; i < length_column_groups_taxes; i++) {
            col_a++
            HEADER_current_taxes = column_groups_taxes[i]
            filter_type = HEADER_current_taxes.type
            filter_name = HEADER_current_taxes.name
            filter_employer = HEADER_current_taxes.employer
            var header_values = ['TAXES', filter_type, filter_name, filter_employer, 'amount']
            for (let row_a = 0; row_a < height_header_base; row_a++) {
                complete_array_table[row_a][col_a] = header_values[row_a]
            }

            for (let i = 0; i < length_complete_JSON_table; i++) {
                row_a = i + height_header_base
                row_a_list = complete_JSON_table[i].taxes
                row_a_list = _.filter(row_a_list, ['type', filter_type])
                row_a_list = _.filter(row_a_list, ['name', filter_name])
                row_a_list = _.filter(row_a_list, ['employer', filter_employer])
                length_row_a_list = row_a_list.length
                if (length_row_a_list === 0) {
                    complete_array_table[row_a][col_a] = '---'
                }
                else {
                    complete_array_table[row_a][col_a] = row_a_list[0].amount
                }

            }
        }

    }

    //DEDUCTIONS COLUMNS
    column_groups_deductions = column_groups.deductions
    length_column_groups_deductions = column_groups_deductions.length
    if (length_column_groups_deductions > 0) {
        for (let i = 0; i < length_column_groups_deductions; i++) {
            col_a++
            HEADER_current_deductions = column_groups_deductions[i]
            filter_type = HEADER_current_deductions.type
            filter_name = HEADER_current_deductions.name
            filter_pre_tax = HEADER_current_deductions.pre_tax
            var header_values = ['DEDUCTIONS', filter_type, filter_name, filter_pre_tax, 'amount']
            for (let row_a = 0; row_a < height_header_base; row_a++) {
                complete_array_table[row_a][col_a] = header_values[row_a]
            }
            for (let i = 0; i < length_complete_JSON_table; i++) {
                row_a = i + height_header_base
                row_a_list = complete_JSON_table[i].employee_deductions
                row_a_list = _.filter(row_a_list, ['type', filter_type])
                row_a_list = _.filter(row_a_list, ['name', filter_name])
                row_a_list = _.filter(row_a_list, ['pre_tax', filter_pre_tax])
                length_row_a_list = row_a_list.length
                if (length_row_a_list === 0) {
                    complete_array_table[row_a][col_a] = '---'
                }
                else {
                    complete_array_table[row_a][col_a] = row_a_list[0].amount
                }

            }
        }

    }

    //CONTRIBUTIONS COLUMNS - employer_contributions
    column_groups_contributions = column_groups.contributions
    length_column_groups_contributions = column_groups_contributions.length
    if (length_column_groups_contributions > 0) {
        for (let i = 0; i < length_column_groups_contributions; i++) {
            col_a++
            HEADER_current_contributions = column_groups_contributions[i]
            filter_type = HEADER_current_contributions.type
            filter_name = HEADER_current_contributions.name
            var header_values = ['CONTRIBUTIONS', filter_type, filter_name, '---', 'amount']
            for (let row_a = 0; row_a < height_header_base; row_a++) {
                complete_array_table[row_a][col_a] = header_values[row_a]
            }
            for (let i = 0; i < length_complete_JSON_table; i++) {
                row_a = i + height_header_base
                row_a_list = complete_JSON_table[i].employer_contributions
                row_a_list = _.filter(row_a_list, ['type', filter_type])
                row_a_list = _.filter(row_a_list, ['name', filter_name])
                length_row_a_list = row_a_list.length
                if (length_row_a_list === 0) {
                    complete_array_table[row_a][col_a] = '---'
                }
                else {
                    complete_array_table[row_a][col_a] = row_a_list[0].amount
                }

            }
        }

    }

    //FOR TESTING ADD INDIVIDUAL ID COLUMNS
    if (length_column_groups_contributions > 0) {
        col_a++
        for (let row_a = 0; row_a < height_header_base; row_a++) {
            complete_array_table[row_a][col_a] = 'INDIVIDUAL_ID'
        }
        for (let i = 0; i < length_complete_JSON_table; i++) {
            row_a = i + height_header_base
            complete_array_table[row_a][col_a] = complete_JSON_table[i].individual_id
        }
    }

    //FOR TESTING ADD PAYMENT ID COLUMNS
    if (length_column_groups_contributions > 0) {
        col_a++
        for (let row_a = 0; row_a < height_header_base; row_a++) {
            complete_array_table[row_a][col_a] = 'PAYMENT_ID'
        }
        for (let i = 0; i < length_complete_JSON_table; i++) {
            row_a = i + height_header_base
            complete_array_table[row_a][col_a] = complete_JSON_table[i].payment_id
        }
    }

    console.log('complete_array_table')
    console.log(complete_array_table)
    console.log("----------------------------------------------------------------------------------------------------")

    return complete_array_table;

}

// this function builds the JSON table (array of objects) that is subsequently converted into a full array table by function build_flat_list_deliver
// CALLED BY: function build_flat_list_deliver
function build_json_table(DIRECTORY, PAYMENT, PAYMENT_STATEMENT) {
    var directory = DIRECTORY.individuals
    var payment = PAYMENT
    var pay_statement = PAYMENT_STATEMENT.responses

    var flat_pay_statement = flatten_pay_statement(pay_statement)
    var directory_list_rekeyed = renameKeyInJsonTable(directory, 'id', 'individual_id')
    var payment_list_rekeyed = renameKeyInJsonTable(payment, 'id', 'payment_id')
    var payment_list_rekeyed = renameKeyInJsonTable(payment, 'gross_pay', 'payment_full_gross_pay')
    var payment_list_rekeyed = renameKeyInJsonTable(payment, 'net_pay', 'payment_full_net_pay')

    var join_directory_paystatements = join_ADD_MISSING_KEYS(flat_pay_statement, directory_list_rekeyed, 'individual_id')
    var list_fully_merged = join_ADD_MISSING_KEYS(join_directory_paystatements, payment_list_rekeyed, 'payment_id')

    return list_fully_merged;

}

// this function flattens pay-statements to the line-level
// CALLED BY: function build_json_table
function flatten_pay_statement(pay_statement_list) {

    var pay_statement_list_length = pay_statement_list.length
    var pay_statement_flattened = []

    //extracts and flattens all the pay-statements into a list
    for (let i = 0; i < pay_statement_list_length; i++) {
        var pay_statement_list_current = pay_statement_list[i].body.pay_statements
        var pay_statement_list_current_ID = pay_statement_list[i].payment_id
        var pay_statement_list_current_length = pay_statement_list_current.length
        for (let i = 0; i < pay_statement_list_current_length; i++) {
            var pay_statement_current = pay_statement_list_current[i]
            pay_statement_current.payment_id = pay_statement_list_current_ID
            pay_statement_flattened.push(pay_statement_current)
        }
    }

    console.log("pay_statement_flattened")
    console.log(pay_statement_flattened)
    pay_statement_flattened = _.sortBy(pay_statement_flattened, 'individual_id');

    pay_statement_flattened_length = pay_statement_flattened.length

    return pay_statement_flattened;
}

// this function builds the column groups for the EARNINGS/TAXES/DEDUCTIONS/CONTRIBUTIONS super headers
// these groups are built dynamically based on uniquness of type+name+employer+pre_tax fields when available in the group
// for instance EARNINGS only uses type+name but TAXES uses type+name+employer
// CALLED BY: function build_flat_list_deliver
function build_column_groups(pay_statement_flattened) {

    pay_statement_flattened_length = pay_statement_flattened.length

    //these objects will define the columns built for export
    var COLUMN_EARNINGS = []
    var COLUMN_TAXES = []
    var COLUMN_DEDUCTIONS = []
    var COLUMN_CONTRIBUTIONS = []

    join_fields_earnings_contributions = ['type', 'name']
    join_fields_taxes = ['type', 'name', 'employer']
    join_fields_deductions = ['type', 'name', 'pre_tax']

    for (let i = 0; i < pay_statement_flattened_length; i++) {

        var current_EARNINGS = pay_statement_flattened[i].earnings
        var current_TAXES = pay_statement_flattened[i].taxes
        var current_DEDUCTIONS = pay_statement_flattened[i].employee_deductions
        var current_CONTRIBUTIONS = pay_statement_flattened[i].employer_contributions

        var COLUMN_EARNINGS_length = COLUMN_EARNINGS.length
        var COLUMN_TAXES_length = COLUMN_TAXES.length
        var COLUMN_DEDUCTIONS_length = COLUMN_DEDUCTIONS.length
        var COLUMN_CONTRIBUTIONS_length = COLUMN_CONTRIBUTIONS.length

        if (COLUMN_EARNINGS_length == 0) {
            COLUMN_EARNINGS = current_EARNINGS
        }
        else {
            COLUMN_EARNINGS = join_ADD_MISSING_OBJECTS(COLUMN_EARNINGS, current_EARNINGS, join_fields_earnings_contributions)
        }

        if (COLUMN_TAXES_length == 0) {
            COLUMN_TAXES = current_TAXES
        }
        else {
            COLUMN_TAXES = join_ADD_MISSING_OBJECTS(COLUMN_TAXES, current_TAXES, join_fields_taxes)
        }

        if (COLUMN_CONTRIBUTIONS_length == 0) {
            COLUMN_CONTRIBUTIONS = current_CONTRIBUTIONS
        }
        else {
            COLUMN_CONTRIBUTIONS = join_ADD_MISSING_OBJECTS(COLUMN_CONTRIBUTIONS, current_CONTRIBUTIONS, join_fields_earnings_contributions)
        }

        if (COLUMN_DEDUCTIONS_length == 0) {
            //console.log('COLUMN_DEDUCTIONS_length')
            //console.log(COLUMN_DEDUCTIONS_length)
            COLUMN_DEDUCTIONS = current_DEDUCTIONS
        }
        else {
            COLUMN_DEDUCTIONS = join_ADD_MISSING_OBJECTS(COLUMN_DEDUCTIONS, current_DEDUCTIONS, join_fields_deductions)
        }


    }

    var column_groups = { taxes: COLUMN_TAXES, earnings: COLUMN_EARNINGS, contributions: COLUMN_CONTRIBUTIONS, deductions: COLUMN_DEDUCTIONS }

    return column_groups;
}

// this function renames a keys for all objects in a JSON table
// CALLED BY: function build_json_table
function renameKeyInJsonTable(jsonTable, oldKey, newKey) {
    if (oldKey === newKey) {
        return jsonTable;
    }

    return jsonTable.map(obj => {
        if (Object.prototype.hasOwnProperty.call(obj, oldKey)) {
            obj[newKey] = obj[oldKey];
            delete obj[oldKey];
        }
        return obj;
    });
}

// this function looks at two JSON tables (list1+list2) and adds objects to list1 that are present in list2
// and NOT already in list1 - this is used for building column headers by capturing all unique objects in the
// EARNINGS/TAXES/DEDUCTIONS/CONTRIBUTIONS lists
// CALLED BY: function build_column_groups
function join_ADD_MISSING_OBJECTS(list1, list2, joinKeys) {
    const joinedList = [...list1];

    list2.forEach(item2 => {
        const matchIndex = joinedList.findIndex(item1 =>
            joinKeys.every(key => item1[key] === item2[key])
        );

        if (matchIndex === -1) {
            joinedList.push(item2);
        }
    });

    return joinedList;
}

// this function takes two JSON tables - arr1 is a longer table with many instances of objects with the same "key" value in
// arr2 - every object in arr1 that key matches an object in arr2 will get all of arg2 object's unique keys
// this function is used to enhance the pay-statement data with directory and payment data
// CALLED BY: function build_json_table
function join_ADD_MISSING_KEYS(arr1, arr2, key) {
    return arr1.map(obj1 => {
        const matchingObj2 = arr2.filter(obj2 => obj2[key] === obj1[key])[0];
        return { ...obj1, ...matchingObj2 };
    });
}

// builds a CSV
// CALLED BY: function kickoff_process
function export_csv(flat_list_deliver) {
    //BUILD CSV EXPORT
    let csvContent = "data:text/csv;charset=utf-8,"
        + flat_list_deliver.map(e => e.join(",")).join("\n");
    var encodedUri = encodeURI(csvContent);

    return encodedUri;
}
