import {
  Datagrid,
  TextField,
  List,
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
  TimeInput,
  DateTimeInput,
  NumberInput,
  BooleanInput,
  Create,
} from "react-admin";


const getListInputs = (cols: {name:string,type:string,format:string,required:boolean}[])=>{


    return cols.map(col=>col.format.split(' ')[0] == 'date'?<DateInput label={col.name} key={col.name} source={col.name} />:
    col.format.split(' ')[0] == 'time'?<TimeInput  parse={(date: Date) => {return date;}} label={col.name} key={col.name} source={col.name} />:
    col.format.split(' ')[0] == 'timestamp'?<DateTimeInput parse={(date: string) =>{return date.replace('T',' ');} } label={col.name} key={col.name} source={col.name} />:
    col.type == 'integer' ?<NumberInput step={1} label={col.name} key={col.name} source={col.name} />:
    col.type == 'number' ?<NumberInput label={col.name} key={col.name} source={col.name} />:
    col.type == 'boolean' ?<BooleanInput label={col.name} key={col.name} source={col.name} />:
    <TextInput multiline fullWidth label={col.name} key={col.name} source={col.name} />
  )
};

const getListFilters = (cols: {name:string,type:string,format:string,required:boolean}[])=>{
  var filterFieldList:any[] = [];
  for(let col of cols ){
    
    if(col.type == 'string' && !(['date','time','timestamp'].includes(col.format.split(' ')[0]))){
      filterFieldList = filterFieldList.concat([
        <TextInput multiline label={col.name+' ='} key={col.name} source={col.name} />,
        <TextInput multiline label={col.name+' contains'} key={col.name+'@ilike'} source={col.name+'@ilike'} />,
        <TextInput multiline label={col.name+' not contains'} key={col.name+'@not.ilike'} source={col.name+'@not.ilike'} />,
      ])
    }
    if(col.format.split(' ')[0] == 'date'){
      filterFieldList =filterFieldList.concat([
        <DateInput label={col.name+' ='} key={col.name} source={col.name} />,
        <DateInput label={col.name+' >='} key={col.name+'@gte'} source={col.name+'@gte'} />,
        <DateInput label={col.name+' <='} key={col.name+'@lte'} source={col.name+'@lte'} />
      ])
    }
    if(col.format.split(' ')[0] == 'time'){
      filterFieldList =filterFieldList.concat([
        <TimeInput parse={(date: Date) => {return date;}} label={col.name+' ='} key={col.name} source={col.name} />,
        <TimeInput parse={(date: Date) => {return date;}} label={col.name+' >='} key={col.name+'@gte'} source={col.name+'@gte'} />,
        <TimeInput parse={(date: Date) => {return date;}} label={col.name+' <='} key={col.name+'@lte'} source={col.name+'@lte'} />
      ])
    }
    if(col.format.split(' ')[0] == 'timestamp'){
      filterFieldList =filterFieldList.concat([
        <DateTimeInput parse={(date: string) => {return date.replace('T',' ');}} label={col.name+' ='} key={col.name} source={col.name} />,
        <DateTimeInput parse={(date: string) => {return date.replace('T',' ');}} label={col.name+' >='} key={col.name+'@gte'} source={col.name+'@gte'} />,
        <DateTimeInput parse={(date: string) => {return date.replace('T',' ');}} label={col.name+' <='} key={col.name+'@lte'} source={col.name+'@lte'} />
      ])
    }
    if(col.type == 'integer'){
      filterFieldList =filterFieldList.concat([
        <NumberInput step={1} label={col.name+' ='} key={col.name} source={col.name} />,
        <NumberInput step={1} label={col.name+' >='} key={col.name+'@gte'} source={col.name+'@gte'} />,
        <NumberInput step={1} label={col.name+' <='} key={col.name+'@lte'} source={col.name+'@lte'} />,
        <NumberInput step={1} label={col.name+' >'} key={col.name+'@gt'} source={col.name+'@gt'} />,
        <NumberInput step={1} label={col.name+' <'} key={col.name+'@lt'} source={col.name+'@lt'} />
      ])
    }
    if(col.type == 'number'){
      filterFieldList =filterFieldList.concat([
        <NumberInput label={col.name+' ='} key={col.name} source={col.name} />,
        <NumberInput label={col.name+' >='} key={col.name+'@gte'} source={col.name+'@gte'} />,
        <NumberInput label={col.name+' <='} key={col.name+'@lte'} source={col.name+'@lte'} />,
        <NumberInput label={col.name+' >'} key={col.name+'@gt'} source={col.name+'@gt'} />,
        <NumberInput label={col.name+' <'} key={col.name+'@lt'} source={col.name+'@lt'} />
      ])
    }
    if(col.type == 'boolean'){
      filterFieldList = filterFieldList.concat([
        <BooleanInput label={col.name+' ='} key={col.name+' ='} source={col.name} />,
      ])
    }
    
  }
  return(filterFieldList);
}

export const TableEdit = (cols: {name:string,type:string,format:string,required:boolean}[]) => (
  <Edit>
    <SimpleForm>
      {getListInputs(cols)}
    </SimpleForm>
  </Edit>
);

export const TableCreate = (cols: {name:string,type:string,format:string,required:boolean}[]) => (
  <Create>
    <SimpleForm>
      {getListInputs(cols)}
    </SimpleForm>
  </Create>
);


const TableView = (cols: {name:string,type:string,format:string,required:boolean}[]) => {
  return (
    <List filters={getListFilters(cols)} queryOptions={{ meta: { columns: ["ctid", "*"] } }}>
      <Datagrid
      sx={{
        height: '50',
        '& .RaDatagrid-tableWrapper': {
          width: '84vw',

          overflow: 'auto',
          height: '74vh',
        
        },
    }} 
        //stickyHeader={true}
        rowClick="edit"
        size={"small"}
        
      >
        {cols.map((col) => (
          <TextField key={col.name} source={col.name} />
        ))}
      </Datagrid>
    </List>
  );
};

export default TableView;
