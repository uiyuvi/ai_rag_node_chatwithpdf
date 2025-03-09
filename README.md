Learning this from [youtube](https://www.youtube.com/watch?v=Tx_k1M9QuqM&t=351s)
1. create new project using npm-express-generator
2. create mongodb atlas account

    2.1. create organistation - restrict access based on ip

    2.2. create new project

    2.3. Database access >  new user > username and password , role to add and read items from db > create user

    2.4. create cluster(database) > free > do not change any other options > create - [to store vectors in database](#step-1)

        2.4.1. Already created username and password for the db should be present > local environment > ip address list > allow ip will connect > cluster will be created

        2.4.2. Get conenction string > copy connection string and replace with db password > create .env file > DB=connectionstring > with dotenv package you can access config

    2.5. test connection with mongodb

3. Embeddings - read more about it [openai](https://platform.openai.com/docs/guides/embeddings)

    3.1 Encoder - [using openai Encoder to create vector](#step-1)
        3.1.1. install openai / call openai endpoint using axios

        3.1.2. create key in openai api

            3.1.2.1. configure OPENAI_API_KEY=keycreatedatopenapi, OPENAI_API_ORGANIZATION=organizationid

        3.1.3. expose /embeddings api, test embeddings creation

            3.1.3.1. if you face 429 error - check your credits are expired undr usage. if yes, buy minimum credits to make this work.
    3.2 Load document - using pdf2json


### Vector search Architecture

## step 1:
    pdf > chunk > encoder(openai,llama,word2vec) -> vector -> vector db
    
