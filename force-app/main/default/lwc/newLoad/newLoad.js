import { LightningElement, api, wire } from 'lwc';
import { getRecord, getRecordNotifyChange, deleteRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

import getProducts from '@salesforce/apex/NewLoadController.getProducts';
import createLoadProduct from '@salesforce/apex/NewLoadController.createLoadProduct';
import getLoads from '@salesforce/apex/NewLoadController.getLoads';

const newLoadColumns = [
    {
        label: 'Product',
        fieldName: 'rowName',
        type: 'text'
    },
    {
        label: 'Price',
        fieldName: 'unitPrice',
        type: 'currency'
    },
    {
        label: 'Quantity',
        fieldName: 'quantity',
        type: 'number',
        editable: true
    }
];

const existingLoadActions = [
    {
        label: 'Delete',
        name: 'delete'
    }
]

const existingLoadColumns = [
    { 
        label: 'Time',
        fieldName: 'idUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'rowName' }
        }
    },
    {
        label: 'Quantity',
        fieldName: 'quantity',
        type: 'number'
    },
    {
        label: 'Value',
        fieldName: 'value',
        type: 'currency'
    },
    {
        type: 'action',
        typeAttributes: {
            rowActions: existingLoadActions,
            menuAlignment: 'right'
        }
    }

];



export default class NewLoad extends LightningElement {
    @api recordId;

    newLoadData;
    newLoadColumns = newLoadColumns;
    @wire(getRecord, {
        recordId: '$recordId',
        fields: 'Vendor__c.Location__c'
    })
    wiredRecord({data,error}) {
        if(data){
            getProducts({
                locationId: data.fields.Location__c.value
            }).then((data) => {
                this.newLoadData = data;
            })
        }
    }
    
    existingLoadData;
    existingLoadColumns = existingLoadColumns;
    @wire(getLoads, {
        vendorId: '$recordId'
    })
    wiredExistingLoads(value) {
        this.refreshExistingLoadData = value;
        let {data,error} = value;
        if(data){
            let idUrl;
            let loads = data.map(row => {
                idUrl = `/${row.rowId}`;
                return {...row, idUrl}
            })

            loads = JSON.parse(JSON.stringify(loads));

            for(let i = 0; i < loads.length; i++){
                loads[i]._children = loads[i]['loadProducts'].map(row => {
                    idUrl = `/${row.rowId}`;
                    return {...row, idUrl}
                })
            }

            this.existingLoadData = loads;
        }
    }

    isLoading = false;
    draftValues = [];
    handleSave(event){
        this.isLoading = true;
        createLoadProduct({
            productsFromLwc: JSON.stringify(event.detail.draftValues),
            vendorId: this.recordId
        }).then(() => {
            this.draftValues = [];
            getRecordNotifyChange([{recordId: this.recordId}]);
        }).finally(() => {
            refreshApex(this.refreshExistingLoadData);
            this.isLoading = false;
        })
    }

    handleRowAction(event) {
        let action = event.detail.action;
        switch (action.name) {
            case 'delete':
                deleteRecord(event.detail.row.rowId);   
        }
        getRecordNotifyChange([{recordId: this.recordId}]);
        refreshApex(this.refreshExistingLoadData);
    }
}