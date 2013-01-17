class OracleInstancePresenter < Presenter
  def to_hash
    {
        :id => model.id,
        :name => model.name,
        :host => model.host,
        :port => model.port,
        :maintenance_db => model.maintenance_db,
        :description => model.description,
        :entity_type => model.class.name.underscore
    }
  end
end