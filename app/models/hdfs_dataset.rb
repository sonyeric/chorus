class HdfsDataset < Dataset
  alias_attribute :file_mask, :query
  attr_accessible :file_mask
  validates_presence_of :file_mask, :workspace
  validate :ensure_active_workspace, :if => Proc.new { |f| f.changed? }


  belongs_to :hdfs_data_source
  belongs_to :workspace
  delegate :data_source, :connect_with, :connect_as, :to => :hdfs_data_source

  after_create :make_hdfs_dataset_created_event, :if => :current_user

  HdfsContentsError = Class.new(StandardError)

  def self.assemble!(attributes, hdfs_data_source, workspace)
      dataset = HdfsDataset.new attributes
      dataset.hdfs_data_source = hdfs_data_source
      dataset.workspace = workspace
      dataset.save!
      dataset
  end

  def contents
    hdfs_query = Hdfs::QueryService.new(hdfs_data_source.host, hdfs_data_source.port, hdfs_data_source.username, hdfs_data_source.version)
    hdfs_query.show(file_mask)
  rescue StandardError => e
    raise HdfsContentsError.new(e)
  end

  def self.source_class
    HdfsDataSource
  end

  def in_workspace?(workspace)
    self.workspace == workspace
  end

  def associable?
    false
  end

  def needs_schema?
    false
  end

  def accessible_to(user)
    true
  end

  def verify_in_source(user)
    true
  end

  def execution_location
    hdfs_data_source
  end

  def ensure_active_workspace
    self.errors[:dataset] << :ARCHIVED if workspace && workspace.archived?
  end

  def make_hdfs_dataset_created_event
    Events::HdfsDatasetCreated.by(current_user).add(
        :workspace => workspace,
        :dataset => self,
        :hdfs_data_source => hdfs_data_source
    )
  end
end