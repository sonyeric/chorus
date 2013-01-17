class DataSource < ActiveRecord::Base
  attr_accessible :name, :description, :host, :port, :maintenance_db, :state, :version, :db_username, :db_password, :as => [:default, :create]
  attr_accessible :shared, :as => :create

  belongs_to :owner, :class_name => 'User'
  has_many :accounts, :class_name => 'InstanceAccount', :inverse_of => :instance, :foreign_key => "instance_id"
  has_one :owner_account, :class_name => 'InstanceAccount', :foreign_key => "instance_id", :inverse_of => :instance, :conditions => proc { {:owner_id => owner_id} }

  has_many :activities, :as => :entity
  has_many :events, :through => :activities

  validates_presence_of :name, :maintenance_db
  validates_numericality_of :port, :only_integer => true, :if => :host?
  validates_length_of :name, :maximum => 64

  validates_with DataSourceNameValidator

  def refresh_databases_later
  end

  def valid_db_credentials?(account)
    connect_with(account).connect!
  rescue DataSourceConnection::Error => e
    raise unless e.error_type == :INVALID_PASSWORD
    false
  end

  def self.accessible_to(user)
    where('data_sources.shared OR data_sources.owner_id = :owned OR data_sources.id IN (:with_membership)',
          owned: user.id,
          with_membership: user.instance_accounts.pluck(:instance_id)
    )
  end

  private

  def account_owned_by(user)
    accounts.find_by_owner_id(user.id)
  end
end