import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getRecordNotifyChange } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

import getProducts from '@salesforce/apex/NewLoadController.getProducts';
import createLoadProduct from '@salesforce/apex/NewLoadController.createLoadProduct';
import getLoads from '@salesforce/apex/NewLoadController.getLoads';

const newLoadColumns = [
    {
        label: 'Product',
        fieldName: 'name',
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

const existingLoadColumns = [
    { 
        label: 'Number',
        fieldName: 'idUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' }
        }
    },
    { 
        label: 'Created Date', 
        fieldName: 'CreatedDate', 
        type: 'date',
        typeAttributes: {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }
    },
    {
        label: 'Value',
        fieldName: 'Value__c',
        type: 'currency'
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
            this.existingLoadData = data.map(row => {
                idUrl = `/${row.Id}`;
                return {...row, idUrl}
            })
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
}