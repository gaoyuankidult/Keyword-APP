from bs4 import BeautifulSoup as bs
import urlparse
from urllib2 import urlopen
from urllib2 import Request
from urllib import urlretrieve


import os
import sys
import codecs

from mysql_messager import MysqlMessager 

class AbstractCrawler(object):
    """
    Class :  AbstractCrawler
    Description: The AbstractCrawler class makes interfaces other crawlers.
    """
    def __init__(self):
        self.name = self.__class__.__name__
        self.log_dir = "crawler_logs/"

    def set_name(self, name):
        """ Set name of crawler
        @param name The name to set
        """
        self.name = name
    def __repr__(self):
        """ Show descriptions of this class
        @param self Pointer to class
        """
        return "<AbstractCrawler name:%s>"%self.name
        

    def _downloader(self, url, out_folder="doc/"):
        """ Download the webpage and store it python data sttructure
        @param self Pointer to class
        @param url URL to be downloaded
        @param out_folder Folder that stores information
        """""
        soup = bs(urlopen(url))
        return soup

    def _parse_and_store(self, soup):
        """ Parses the webpage privided to crawl and store them in database
        @param self Pointer to class
        @param soup Structured data to be parsed
        """
        pass

    def crawl(self):
        """ crawl informations from page
        @param self Pointer to class
        @param url URL to be downloaded
        """
        pass   


    def crawl(self):
        """ crawl informations from page
        @param self Pointer to class
        @param url URL to be downloaded
        """
        pass

class NameCrawler(AbstractCrawler):
    def __init__(self):
        """ Set up mysql messager
        @param self Pointer to class
        """
        super(NameCrawler, self).__init__()
        self.mm = MysqlMessager("Persons")
        
    def __repr__(self):
        """ Show descriptions of this class
        @param self Pointer to class
        """
        return "<NameCrawler name:%s>"%self.name
    def _parse_and_store(self, soup):
        """ Parses the webpage privided to crawl and store them in database
        @param self Pointer to class
        @param soup Structured data to be parsed
        """
        super(NameCrawler, self)._parse_and_store(soup)
        log_file = codecs.open(self.log_dir + "name_crawler_log_file.txt",  "w","utf-8")
        self.mm.clear_table()
        for link in soup.findAll("a"):
            if link.has_key('rel') and 'Person' == link['rel']:
                names = link.span.contents[0].split(',')
                href = link['href']
                sql = u"INSERT INTO Persons (ID, FirstName, LastName, Link) VALUES (default, \"" + names[0]+u"\",\"" + names[1] + u"\",\""+ href + u"\")"
                self.mm.excute_sql(sql, log_file)
        log_file.close()

    def _downloader(self, url, out_folder="doc/"):
        """ Download the webpage and store it python data sttructure
        @param self Pointer to class
        @param url URL to be downloaded
        @param out_folder Folder that stores information
        """""
        return super(NameCrawler, self)._downloader(url)

    def crawl(self, url):
        """ crawl informations from page
        @param self Pointer to class
        @param url URL to be downloaded
        """
        soup = self._downloader(url)
        self._parse_and_store(soup)
        

class PaperNameCrawler(AbstractCrawler):
    """
    Class :  PaperNameCrawler
    Description: Paper Name crawler crawls the name of paper from Tuhat Database of University of Helsinki given name of the auther.
    """
    def __init__(self):
        """ Set up mysql messager
        @param self Pointer to class
        """
        super(PaperNameCrawler, self).__init__()
        self.mm = MysqlMessager("PaperNames")
            
    def crawl(self):
        """ crawl informations from page
        @param self Pointer to class
        """
        self.mm.clear_table()
        sql = "SELECT * FROM Persons"
        self.mm.excute_sql(sql)
        iter = self.mm.fetch()
        for row in iter:
            url = row[3]
            soup = self._downloader(url)
            self._parse_and_store(soup, row[0])
            
    def _downloader(self, url, out_folder="doc/"):
        """ Download the webpage and store it python data sttructure
        @param self Pointer to class
        @param url URL to be downloaded
        @param out_folder Folder that stores information
        """""
        return super(PaperNameCrawler, self)._downloader(url)

     
    def  _parse_and_store(self, soup, foreign_key):
        def doi2url(doi):
            """
            Return a bibTeX string of metadata for a given DOI.
            ##TODO: Not working for now
            """
            try:
                link = urlopen(doi).geturl()
            except  Exception,e:
                # Error occured while resolving doi address
                print "Exception happended while processing doi: %s"%e
                link = doi
            print link
            return link

        super(PaperNameCrawler, self)._parse_and_store(soup)
        print self.log_dir
        log_file = codecs.open(self.log_dir + "paper_name_crawler_log_file.txt",  "w","utf-8")
        for p in soup.findAll('p', {'class':'uh_relationlist'}):  
            inner_soup = self._downloader(p.a['href'] )
            if 'publications.html' == p.a['href'] .split('/')[-1]:
                for inner_link in inner_soup.findAll('h2', {'class':'title'}):  
                    paper_names = inner_link.a.span.contents[0]
                    paper_link = inner_link.a['href']
                    paper_soup = self._downloader(paper_link)
                    paper_out_link_resolved = "default"
                    try:
                        doi = paper_soup.findAll('ul', {'class':'relations digital_object_identifiers'})[0].li.a['href']
                        paper_out_link_resolved =  u"\"" + doi2url(doi) + u"\""
                        #paper_out_link_resolved =  doi2url(doi)
                        time.sleep(60)
                    except:
                        # can not find any links in the webpage
                        try:
                            # then tries to find whether there is any link connects to the paper
                            for h in paper_soup.findAll('h3', {'class':'subheader'}):
                                if h.contents[0] == "Links":
                                    print "Links"
                                    paper_out_link_resolved = u"\"" + h.parent.ul.li.a['href'] + u"\""
                        except:
                            # can not find links either
                            pass
                    sql = u"INSERT INTO PaperNames (Paper_ID, PaperName, Link, P_ID) VALUES ( default,\"" + paper_names + u"\", " + paper_out_link_resolved  + u", " + str(foreign_key) + u")"
                    print sql
                    self.mm.excute_sql(sql, log_file)
        log_file.close()
        
class PaperAbstractCrawler(AbstractCrawler):
    """
    Class :  PaperNameCrawler
    Description: Paper Name crawler crawls the name of paper from Tuhat Database of University of Helsinki given name of the auther.
    """
    def __init__(self):
        """ Set up mysql messager
        @param self Pointer to class
        """
        super(PaperAbstractCrawler, self).__init__()
        self.mm = MysqlMessager("PaperLinks")
        self.libraries = []
            
    def crawl(self):
        """ crawl informations from page
        @param self Pointer to class
        """
        import time
        import random
        #self.mm.clear_table()
        sql = "SELECT PaperNames.PaperName,PaperNames.Paper_ID, Persons.FirstName, LastName FROM PaperNames inner join Persons on PaperNames.P_ID = Persons.ID"
        self.mm.excute_sql(sql)
        iter = self.mm.fetch()
        for row in iter:
            if row[1] > 337:
                self.name = row[0]
                url_name = '+'.join(self.name.split(' '))
                url  = "http://scholar.google.fi/scholar?as_q=%s&as_occt=title&hl=en"%url_name            
                print url
                try:
                    soup = self._downloader(url)
                    self._parse_and_store(soup,row[1])
                except Exception, e :
                    print e
                time.sleep( random.randint(60, 800)) 
                    
    def _downloader(self, url, out_folder="doc/"):
        """ Download the webpage and store it python data sttructure
        @param self Pointer to class
        @param url URL to be downloaded
        @param out_folder Folder that stores information
        """""
        hdr = {'User-Agent': 'Mozilla/5.0'}
        req = Request(url,headers=hdr)
        page = urlopen(req)
        soup = bs(page)
        return soup

    def  _parse_and_store(self, soup, foreign_key):
        super(PaperAbstractCrawler, self)._parse_and_store(soup)
        log_file = codecs.open(self.log_dir + "abstract_crawler_log_file.txt",  "w","utf-8")
        for h in soup.findAll('h3', {'class':'gs_rt'}):
            try:
                try:
                    link = h.a["href"] 
                except:
                    link = ""
                
                sql = u"INSERT INTO PaperLinks (Link_ID, PaperLink, Paper_ID) VALUES ( default,\"" + link+ u"\", " + str(foreign_key) + u")"
                print sql
                self.mm.excute_sql(sql, log_file)   
            except Exception, e:
                print "Something wrong happended."
                
           #we only take the first one
            break

        log_file.close()
        
class CourseContentCrawler(AbstractCrawler):
    def __init__(self):
        super(AbstractCrawler, self).__init__()        
        self.mm = MysqlMessager("CourseDescription")
        self.libraries = []        
    def _downloader(self, url, out_folder="doc/"):
        """ Download the webpage and store it python data sttructure
        @param self Pointer to class
        @param url URL to be downloaded
        @param out_folder Folder that stores information
        """""
        hdr = {'User-Agent': 'Mozilla/5.0'}
        req = Request(url,headers=hdr)
        page = urlopen(req)
        soup = bs(page)
        return soup       
    def crawl(self):
        """ crawl informations from page
        @param self Pointer to class
        """
        self.mm.clear_table()
        url = "http://www.cs.helsinki.fi/en/courses?y=2014&s%5B%5D=K&l%5B%5D=E"
        try:
            soup = self._downloader(url)
            self._parse_and_store(soup)
        except Exception, e :
            print e
            
    def  _parse_and_store(self, soup):
        super(CourseContentCrawler, self)._parse_and_store(soup) 
        log_file = codecs.open(self.log_dir + "course_abstraction_crawler_log_file.txt",  "w","utf-8")        
        for iter in soup.findAll('span', {'class':'views-field-title'}):
            link = u"http://www.cs.helsinki.fi/" + iter.span.a['href']
            course_name = iter.span.a.contents[0]
            inner_soup = self._downloader(link)
            try:
                course_description =  inner_soup.findAll('div', {'class':'views-field-field-db-tiivistelma-value'})[0].div.contents[0]
            except:
                course_description = "not found"
            sql = u"INSERT INTO CourseDescription (Course_ID, Course_Name, Course_Description) VALUES ( default,\"" + course_name+ u"\", \"" + course_description + u"\")"               
            print sql  
            self.mm.excute_sql(sql, log_file)        
def unit_test():
    #name_crawler = NameCrawler()
    #url = "https://tuhat.halvi.helsinki.fi/portal/en/organisations-units/department-of-compu(225405e8-3362-4197-a7fd-6e7b79e52d14)/persons.html?pageSize=all&page=0&filter=current"
    #name_crawler.crawl(url)
    #paper_name_crawler = PaperNameCrawler()
    #paper_name_crawler.crawl()
    abstract_crawler = PaperAbstractCrawler()
    abstract_crawler.crawl()
    #course_coontent_crawler = CourseContentCrawler()
    #course_coontent_crawler.crawl()
    

 
if __name__ == "__main__":
    unit_test()
