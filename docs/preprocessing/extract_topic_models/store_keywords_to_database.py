"""
This file is for storing pickle file to database.

Step of pre-processing is like this

1. extract abstract link from website
2. download abstract from links
3. store them in a xml file
4. extract keywords from xml and store them in a pickle file.
5. combine all keywords to form new abstract using csv form
6. store abstract in database
7. store newly formed abstract in database

this file implements the 7 step

"""
from sys import stderr
from pickle import load
from data

def read_pickle_file(pickle_file_path):
    """
    This file reads information according from a pickler file path and return the content.
    """
    try:
        with open(pickle_file_path) as f:
            return load(f)
    except IOError, e:
        print >> stderr, e
        return None


if __name__ == "__main__":

    read_pickle_file()