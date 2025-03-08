Learning this from - https://www.youtube.com/watch?v=Tx_k1M9QuqM&t=351s
1. create new project using npm-express-generator
2. create mongodb atlas account
    2.1. create organistation - restrict access based on ip
    2.2. create new project
    2.3. Database access >  new user > username and password , role to add and read items from db > create user
    2.4. create cluster > free > do not change any other options > create
        2.4.1. Already created username and password for the db should be present > local environment > ip address list > allow ip will connect > cluster will be created
        2.4.2. Get conenction string > copy connection string and replace with db password > create .env file > DB=connectionstring > with dotenv package you can access config
    2.5. test connection with mongodb
