build:
	docker build -t tgbot .

run:
	docker run  -p 3000:3000 --name tgbot --rm tgbot