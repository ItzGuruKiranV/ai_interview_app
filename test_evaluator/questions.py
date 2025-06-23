import random

Question = [
    'Write a code to get the sum of two numbers ' ,
    'Write a code to get the difference if two numbers' ,
    'wite a code to print your name in function and call that function']


def rand_question():
    random_question = random.choice(Question)
    return random_question

