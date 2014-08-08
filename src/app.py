# Python imports

# Tornado imports
import pymongo
import uuid

import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options
from tornado.web import url
from copy import deepcopy

from handlers.handlers import *


define("port", default=8888, type=int)
define("config_file", default="app_config.yml", help="app_config file")

#MONGO_SERVER = '192.168.1.68'
MONGO_SERVER = 'localhost'


class Application(tornado.web.Application):
    def __init__(self, **overrides):
        #self.config = self._get_config()
        handlers = [
        url(r'/', LoginHandler, name='/'),

        url(r'/charts', ChartsHandler, name='charts'), 
        url(r'/charts_data', ChartsDataHandler, name='charts_data'),
        url(r'/topic_model', TopicModelHandler, name='topic_model'),
        url(r'/tables', TablesHandler, name='tables'), 
        url(r'/tables_data', TablesDataHandler, name='tables_data'), 
        url(r'/article_matrix', ArticleMatrixHandler, name='article_matrix'),
        
        url(r'/form', FormHandler, name = 'form'),
        url(r'/next', NextHandler,name = 'next'),
        url(r'/index', IndexHandler, name='index'),
        url(r'/search', SearchHandler, name='search'),
        url(r'/analyzer', AnalyzerHandler, name='analyzer'),
        url(r'/email', EmailMeHandler, name='email'),
        url(r'/message', MessageHandler, name='message'),
        url(r'/grav', GravatarHandler, name='grav'),
        url(r'/menu', MenuTagsHandler, name='menu'),
        url(r'/slidy', SlidyHandler, name='slidy'),
        url(r'/notification', NotificationHandler, name='notification'),
        url(r'/fb_demo', FacebookDemoHandler, name='fb_demo'),
        url(r'/popup', PopupHandler, name='popup_demo'),
        url(r'/tail', TailHandler, name='tail_demo'),
        url(r'/pusher', DataPusherHandler, name='push_demo'),
        url(r'/pusher_raw', DataPusherRawHandler, name='push_raw_demo'),
        url(r'/matcher/([^\/]+)/', WildcardPathHandler),
        url(r'/back_to_where_you_came_from', ReferBackHandler, name='referrer'),
        url(r'/thread', ThreadHandler, name='thread_handler'),
        url(r'/s3uploader', S3PhotoUploadHandler, name='photos'),

        url(r'/login_no_block', NoneBlockingLogin, name='login_no_block'),
        url(r'/login', LoginHandler, name='login'),
        url(r'/twitter_login', TwitterLoginHandler, name='twitter_login'),
        url(r'/facebook_login', FacebookLoginHandler, name='facebook_login'),
        url(r'/register', RegisterHandler, name='register'),
        url(r'/logout', LogoutHandler, name='logout'),

        ]

        #xsrf_cookies is for XSS protection add this to all forms: {{ xsrf_form_html() }}
        settings = {
            'static_path': os.path.join(os.path.dirname(__file__), 'static'),
            'template_path': os.path.join(os.path.dirname(__file__), 'templates'),
            "cookie_secret":    base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes),
            'twitter_consumer_key': 'KEY',
            'twitter_consumer_secret': 'SECRET',
            'facebook_app_id': '180378538760459',
            'facebook_secret': '7b82b89eb6aa0d3359e2036e4d1eedf0',
            'facebook_registration_redirect_url': 'http://localhost:8888/facebook_login',
            'mandrill_key': 'KEY',
            'mandrill_url': 'https://mandrillapp.com/api/1.0/',

            'xsrf_cookies': False,
            'debug': True,
            'log_file_prefix': "tornado.log",
        }

        tornado.web.Application.__init__(self, handlers, **settings)

        self.syncconnection = pymongo.Connection(MONGO_SERVER, 27017)

        if 'db' in overrides:
            self.syncdb = self.syncconnection[overrides['db']]
        else:
            self.syncdb = self.syncconnection["test-thank"]
        self.syncconnection.close()
        
        
        # following part is for analyzer
        def set_keywords_parameters():
            self.keywords_number = 10
            self._num_of_corpuses = "all" 
            
            # this file stores information of all abstracts
            self.abstracts_filename = "../docs/abstracts/abstracts.xml"
            
            # this file stores informaiton of all keywords as a set
            self.keywords_filename = "../docs/keywords/abstract_%s.txt"%self._num_of_corpuses
            
            # this file stores keywords list of each abstract
            self.corpus_keywords_filename = "../docs/keywords/corpus_abstract_%s.txt"%self._num_of_corpuses
            self.extractors = Extractors(self.abstracts_filename)

            def set_corpuses():
                self.corpus_keywords_file_obj = open(self.corpus_keywords_filename,'r')
                # set preprocessed corpuses, this is different than original corpuses
                self.corpuses = pickle.load(self.corpus_keywords_file_obj)
                self.original_corpuses = self.extractors.project_corpuses
                self.corpus_keywords_file_obj.close()
            def set_titles():
                self.titles = self.extractors.titles
            
            # set all title related parameters
            set_titles()
            # set all the corpuses related parameters
            set_corpuses()

            
        def form_persons_info():    
            # for persons_info
            assert(len(self.original_corpuses) == len(self.corpuses) == len(self.auther_names))
            
            self.corpuses_name_id = {}
            
            # this variable is a list that contains all information of persons
            self.persons_info = []
            
            person_id = 0
            for title,  original_corpuse,  decomposed_corpus, name in zip(self.titles,  self.original_corpuses, self.corpuses, self.auther_names):
                
                if name not in self.corpuses_name_id.keys():
                    self.corpuses_name_id[name] = {}
                    self.corpuses_name_id[name]["id"] = person_id
                    person_id = person_id + 1
                    self.corpuses_name_id[name]["name"] = name
                    self.corpuses_name_id[name]["keywords"] = []
                    self.corpuses_name_id[name]["articles"] = []

                self.corpuses_name_id[name]["articles"].append({"title":"%s"%title ,   "abstract":"%s"%original_corpuse})
                
                # append keywords in list corpuses_name_id[name]["keywords"]
                for keyword in decomposed_corpus.split(','):
                    for keyword_info in self.keywords_info:
                        if keyword == keyword_info["text"]:
                            self.corpuses_name_id[name]["keywords"].append(keyword_info["id"])
            
        def set_iteration_parameters():
            # number of iteration
            self.iter_num = 0
        def analyze_data():
            self.analyzer = Analyzer(self.keywords_list, self.corpuses)
        def form_keywords_info():
            
            self.keywords_file_obj = open(self.keywords_filename,'r')
            
            # set of all keywords
            self.keywords_set = pickle.load(self.keywords_file_obj)

            # get list of auther names 
            self.auther_names = self.extractors.auther_names
            
            # get list of auther names 
            self.auther_names = self.extractors.auther_names

            # length of all keywords
            self.current_selected_keyword_length = len(list(self.keywords_set))
            
            # list of all keywords information: it is a dictionary that contains ("id", "text",  "exploitation", "exploration" ) as keys
            self.keywords_list = list(self.keywords_set)[:self.current_selected_keyword_length]
            self.keywords_id = range(0, self.current_selected_keyword_length)
            
            self.form_new_keywords_information()
            
            self.keywords_file_obj.close()
        
        set_keywords_parameters()
        set_iteration_parameters()
        form_keywords_info()
        form_persons_info()
        analyze_data()

    def form_new_keywords_information(self):
        keywords_exploitation = [0.1] * len( self.keywords_list)
        keywords_exploration = [0.9] * len( self.keywords_list)
        self.keywords_info = zip( self.keywords_id ,self.keywords_list,keywords_exploitation, keywords_exploration)
        self.kewords_keys = ("id", "text",  "exploitation", "exploration" )
        self.keywords_info = [dict(zip(self.kewords_keys, keyword_info)) for keyword_info in self.keywords_info]
        self.keywords = self.keywords_list[self.keywords_number * self.iter_num:self.keywords_number*(self.iter_num +1)]
         
        # keywords after ranking, this variable will only be used in NextHandler
        self.ranked_keywords = deepcopy(self.keywords_info)
        # keywords after user input their preferences, this will be only be used in the SearchHandler
        self.filtered_keywords = deepcopy(self.keywords_info)
        
        # selected keywords, the format is the text of keyword
        self.experienced_keywords = []
        

    def __del__(self):
        super(tornado.web.Application, self).__del__(*args, **kwargs)



# to redirect log file run python with : --log_file_prefix=mylog
def main():
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == '__main__':
    main()
